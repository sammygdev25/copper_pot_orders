"""Orders, written by Shikshya from the plan. The server prices every order: a line names an item and a quantity, the
price is read from the item, the total is the sum of price times quantity, and nothing a request sends sets a price, a
total, the owner, a paid mark or the status. Customers place and read their own orders; staff read every order and move
its status along the plan's steps, never to paid (only the payments webhook marks an order paid). Lines are written
with their order only: the line route reads, it never writes."""
from decimal import Decimal
from typing import Any, Dict, List, Tuple

from django.apps import apps
from django.db import models, transaction
from rest_framework import mixins, permissions, serializers, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from api.permissions import is_staff_user

ORDER_MODEL = 'api.Order'
LINE_MODEL = 'api.OrderItem'
OWNER_FIELD = 'user'
AMOUNT_FIELD = 'total_amount'
STATUS_FIELD = 'status'
STATUSES = ('placed', 'preparing', 'ready', 'completed')
LINES = 'items'
LINE_ORDER = 'order'
LINE_ITEM = 'menu_item'
QUANTITY = 'quantity'
LINE_PRICE = 'price'
ITEM_PRICE = 'price'
ITEM_LABEL = 'name'
PAID_FLAG = ''
# Set only by the payments app's verified webhook.
PAYMENT_FIELDS = ('paid_at', 'stripe_session_id')
ITEMS_KEY = 'items'
MAX_QUANTITY = 99
MAX_LINES = 100


def order_model() -> type:
    return apps.get_model(ORDER_MODEL)


def line_model() -> type:
    return apps.get_model(LINE_MODEL)


def _field_names(model: type) -> List[str]:
    return [f.name for f in model._meta.concrete_fields]


def _auto_dates(model: type) -> List[str]:
    return [f.name for f in model._meta.concrete_fields
            if getattr(f, 'auto_now', False) or getattr(f, 'auto_now_add', False)]


def _touched(model: type) -> List[str]:
    """The fields a save refreshes on its own (auto_now), kept in update_fields so they stay current."""
    return [f.name for f in model._meta.concrete_fields if getattr(f, 'auto_now', False)]


def locked_order_fields() -> Tuple[str, ...]:
    """The order's fields no request writes: the owner, the money, the status, the paid mark, the timestamps."""
    names = set(_field_names(order_model()))
    locked = {OWNER_FIELD, AMOUNT_FIELD, STATUS_FIELD, PAID_FLAG, *PAYMENT_FIELDS, *_auto_dates(order_model())}
    return tuple(sorted((locked - {''}) & names))


class OrderLineSerializer(serializers.ModelSerializer):
    """One line: the item and the quantity are written; the price and the order are the server's."""

    class Meta:
        model = line_model()
        fields = '__all__'
        read_only_fields = tuple(n for n in _field_names(line_model()) if n not in (LINE_ITEM, QUANTITY))
        extra_kwargs = {QUANTITY: {'min_value': 1, 'max_value': MAX_QUANTITY, 'required': True},
                        LINE_ITEM: {'required': True}}

    def get_fields(self) -> Dict[str, serializers.Field]:
        fields = super().get_fields()
        if ITEM_LABEL:
            fields[LINE_ITEM + '_' + ITEM_LABEL] = serializers.CharField(source=LINE_ITEM + '.' + ITEM_LABEL,
                                                                         read_only=True)
        fields[LINE_ITEM + '_price'] = serializers.DecimalField(source=LINE_ITEM + '.' + ITEM_PRICE, max_digits=12,
                                                                decimal_places=2, read_only=True)
        return fields


class OrderSerializer(serializers.ModelSerializer):
    """An order with its lines. Created with its lines in one request; the total is computed here."""

    class Meta:
        model = order_model()
        fields = '__all__'
        read_only_fields = locked_order_fields()

    def get_fields(self) -> Dict[str, serializers.Field]:
        fields = super().get_fields()
        options = {} if LINES == ITEMS_KEY else {'source': LINES}
        fields[ITEMS_KEY] = OrderLineSerializer(many=True, **options)
        if not PAID_FLAG and 'paid_at' in fields:
            fields['is_paid'] = serializers.SerializerMethodField()
        return fields

    def get_is_paid(self, order: models.Model) -> bool:
        return bool(getattr(order, 'paid_at', None))

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        lines = attrs.get(LINES)
        if self.instance is None and not lines:
            raise ValidationError({ITEMS_KEY: 'An order needs at least one item.'})
        if lines and len(lines) > MAX_LINES:
            raise ValidationError({ITEMS_KEY: 'An order takes at most %d lines.' % MAX_LINES})
        return attrs

    @transaction.atomic
    def create(self, validated_data: Dict[str, Any]) -> models.Model:
        lines = validated_data.pop(LINES, None) or []
        priced = []
        total = Decimal('0')
        for line in lines:
            item = line[LINE_ITEM]
            quantity = int(line[QUANTITY])
            price = Decimal(str(getattr(item, ITEM_PRICE) or 0))
            priced.append((item, quantity, price))
            total += price * quantity
        validated_data[AMOUNT_FIELD] = total
        order = order_model().objects.create(**validated_data)
        for item, quantity, price in priced:
            row = {LINE_ORDER: order, LINE_ITEM: item, QUANTITY: quantity}
            if LINE_PRICE:
                row[LINE_PRICE] = price
            line_model().objects.create(**row)
        return order

    def update(self, instance: models.Model, validated_data: Dict[str, Any]) -> models.Model:
        raise PermissionDenied('An order changes through its status only.')


def status_choices() -> Tuple[str, ...]:
    return tuple(s for s in STATUSES if s != 'paid')


class OrderFlowViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
                       viewsets.GenericViewSet):
    """Customers place and read their own orders; another user's order answers 404. Staff read every order and set
    its status. No order is deleted through the API."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    owner_field = OWNER_FIELD

    def get_queryset(self) -> models.QuerySet:
        rows = order_model().objects.all().prefetch_related(LINES).order_by('-pk')
        user = self.request.user
        if not is_staff_user(user):
            rows = rows.filter(**{OWNER_FIELD: user})
        wanted = self.request.query_params.get(STATUS_FIELD) if STATUS_FIELD else None
        if wanted:
            rows = rows.filter(**{STATUS_FIELD: wanted})
        return rows

    def perform_create(self, serializer: serializers.BaseSerializer) -> None:
        serializer.save(**{OWNER_FIELD: self.request.user})

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Staff set the status (PATCH or PUT with a status); every other key is ignored."""
        order = self.get_object()
        if not is_staff_user(request.user):
            raise PermissionDenied('Only staff change an order.')
        choices = status_choices()
        if not STATUS_FIELD or not choices:
            raise PermissionDenied('This order has no status to change.')
        value = request.data.get(STATUS_FIELD)
        if value not in choices:
            raise ValidationError({STATUS_FIELD: 'Choose one of: ' + ', '.join(choices)})
        setattr(order, STATUS_FIELD, value)
        order.save(update_fields=[STATUS_FIELD] + _touched(order_model()))
        return Response(self.get_serializer(order).data)

    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return self.update(request, *args, **kwargs)


class OrderLineReadViewSet(viewsets.ReadOnlyModelViewSet):
    """Lines read on their own: the caller's own orders' lines, every line for staff. Lines are never written here."""
    serializer_class = OrderLineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> models.QuerySet:
        rows = line_model().objects.all().order_by('pk')
        if not is_staff_user(self.request.user):
            rows = rows.filter(**{LINE_ORDER + '__' + OWNER_FIELD: self.request.user})
        return rows


# The plan's own names for these classes, so code that imports them from here finds them.
OrderItemSerializer = OrderLineSerializer
OrderViewSet = OrderFlowViewSet
OrderItemViewSet = OrderLineReadViewSet
