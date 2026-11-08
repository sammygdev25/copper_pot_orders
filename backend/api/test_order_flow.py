"""The order flow's own tests, written by Shikshya with the app: the server prices an order, a request never sets the
money, the owner, the status or a paid mark, a customer reaches only their own orders, and staff move the status but
never to paid. Run with: python manage.py test api"""
import datetime
from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.db import models
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from api.order_flow import (AMOUNT_FIELD, ITEM_PRICE, ITEMS_KEY, LINE_ITEM, LINE_PRICE, LINES, OWNER_FIELD, PAID_FLAG,
                            QUANTITY, STATUS_FIELD, OrderFlowViewSet, OrderLineReadViewSet, OrderSerializer,
                            status_choices,
                            line_model, order_model)
from api.permissions import ROLE_FIELD, STAFF_ROLES, IsStaffOrReadOnly, is_staff_user

LIST = OrderFlowViewSet.as_view({'get': 'list', 'post': 'create'})
DETAIL = OrderFlowViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update'})
_SEQ = [0]


def _value(field: models.Field) -> Any:
    """A valid value for a required field of a row the test needs."""
    _SEQ[0] += 1
    if field.choices:
        return field.choices[0][0]
    if isinstance(field, (models.ForeignKey, models.OneToOneField)):
        return _row(field.related_model)
    if isinstance(field, models.EmailField):
        return 'row%d@example.com' % _SEQ[0]
    if isinstance(field, (models.CharField, models.TextField, models.SlugField, models.URLField)):
        return 'row%d' % _SEQ[0]
    if isinstance(field, models.DecimalField):
        return Decimal('4.75')
    if isinstance(field, models.FloatField):
        return 4.75
    if isinstance(field, models.IntegerField):
        return 1
    if isinstance(field, models.BooleanField):
        return False
    if isinstance(field, models.DateTimeField):
        return timezone.now()
    if isinstance(field, models.DateField):
        return datetime.date.today()
    if isinstance(field, models.TimeField):
        return datetime.time(12, 0)
    return ''


def _row(model: type, **given: Any) -> models.Model:
    """A saved row of any model: the given values, then a value for every required field without a default."""
    if model is get_user_model():
        _SEQ[0] += 1
        return model.objects.create_user(username='user%d' % _SEQ[0], password='Unused-pass-123')
    data = dict(given)
    for field in model._meta.concrete_fields:
        if field.primary_key or field.name in data or field.null or field.has_default():
            continue
        if getattr(field, 'auto_now', False) or getattr(field, 'auto_now_add', False):
            continue
        data[field.name] = _value(field)
    return model.objects.create(**data)


def _staff() -> Any:
    user = _row(get_user_model())
    if ROLE_FIELD and STAFF_ROLES:
        setattr(user, ROLE_FIELD, STAFF_ROLES[0])
    else:
        user.is_staff = True
    user.save()
    return user


def _json(value: Any) -> Any:
    """A value as the browser sends it."""
    if isinstance(value, models.Model):
        return value.pk
    if isinstance(value, Decimal):
        return str(value)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return value


def _order_fields() -> dict:
    """A value for every field the order form must send besides its lines (an address, a phone)."""
    data = {}
    for name, field in OrderSerializer().fields.items():
        if name == ITEMS_KEY or field.read_only or not field.required:
            continue
        data[name] = _json(_value(order_model()._meta.get_field(field.source)))
    return data


class OrderFlowTests(TestCase):
    def setUp(self) -> None:
        self.factory = APIRequestFactory()
        self.customer = _row(get_user_model())
        self.other = _row(get_user_model())
        self.staff = _staff()
        item_model = line_model()._meta.get_field(LINE_ITEM).related_model
        self.item = _row(item_model, **{ITEM_PRICE: Decimal('4.75')})

    def _call(self, view: Any, method: str, user: Any, data: Any = None, pk: Any = None) -> Any:
        request = getattr(self.factory, method)('/orders/', data or {}, format='json')
        if user is not None:
            force_authenticate(request, user=user)
        return view(request, pk=pk) if pk is not None else view(request)

    def _place(self, who: Any, quantity: int = 1, extra: Any = None) -> Any:
        body = {ITEMS_KEY: [{LINE_ITEM: self.item.pk, QUANTITY: quantity}], **_order_fields(), **(extra or {})}
        return self._call(LIST, 'post', who, body)

    def test_an_order_of_three_charges_three(self) -> None:
        res = self._place(self.customer, 3)
        self.assertEqual(res.status_code, 201, res.data)
        order = order_model().objects.get(pk=res.data['id'])
        self.assertEqual(Decimal(str(getattr(order, AMOUNT_FIELD))), Decimal('14.25'))
        line = getattr(order, LINES).get()
        self.assertEqual(getattr(line, QUANTITY), 3)
        if LINE_PRICE:
            self.assertEqual(Decimal(str(getattr(line, LINE_PRICE))), Decimal('4.75'))

    def test_a_posted_total_owner_status_or_paid_mark_is_ignored(self) -> None:
        extra = {AMOUNT_FIELD: '0.50', OWNER_FIELD: self.other.pk}
        if STATUS_FIELD and status_choices():
            extra[STATUS_FIELD] = status_choices()[-1]
        if PAID_FLAG:
            extra[PAID_FLAG] = True
        res = self._place(self.customer, 2, extra)
        self.assertEqual(res.status_code, 201, res.data)
        order = order_model().objects.get(pk=res.data['id'])
        self.assertEqual(Decimal(str(getattr(order, AMOUNT_FIELD))), Decimal('9.50'))
        self.assertEqual(getattr(order, OWNER_FIELD + '_id'), self.customer.pk)
        if STATUS_FIELD and len(status_choices()) > 1:
            self.assertNotEqual(getattr(order, STATUS_FIELD), status_choices()[-1])
        if PAID_FLAG:
            self.assertFalse(getattr(order, PAID_FLAG))

    def test_an_order_needs_items_and_a_quantity_of_at_least_one(self) -> None:
        self.assertEqual(self._call(LIST, 'post', self.customer, {ITEMS_KEY: []}).status_code, 400)
        self.assertEqual(self._place(self.customer, 0).status_code, 400)
        self.assertEqual(self._call(LIST, 'post', None, {ITEMS_KEY: []}).status_code, 401)

    def test_a_customer_reaches_only_their_own_orders(self) -> None:
        mine = self._place(self.customer).data['id']
        theirs = self._place(self.other).data['id']
        self.assertEqual(self._call(DETAIL, 'get', self.customer, pk=theirs).status_code, 404)
        listed = self._call(LIST, 'get', self.customer)
        rows = listed.data['results'] if isinstance(listed.data, dict) else listed.data
        self.assertEqual([r['id'] for r in rows], [mine])

    def test_a_customer_cannot_change_or_delete_an_order(self) -> None:
        mine = self._place(self.customer).data['id']
        if STATUS_FIELD and status_choices():
            body = {STATUS_FIELD: status_choices()[-1]}
            self.assertEqual(self._call(DETAIL, 'patch', self.customer, body, pk=mine).status_code, 403)
        self.assertFalse(hasattr(OrderFlowViewSet, 'destroy'))
        self.assertFalse(hasattr(OrderLineReadViewSet, 'create'))

    def test_staff_move_the_status_but_never_to_paid(self) -> None:
        if not STATUS_FIELD or not status_choices():
            self.skipTest('the order has no status')
        mine = self._place(self.customer).data['id']
        last = status_choices()[-1]
        res = self._call(DETAIL, 'patch', self.staff, {STATUS_FIELD: last}, pk=mine)
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(getattr(order_model().objects.get(pk=mine), STATUS_FIELD), last)
        self.assertEqual(self._call(DETAIL, 'patch', self.staff, {STATUS_FIELD: 'paid'}, pk=mine).status_code, 400)

    def test_staff_read_every_order_and_the_role_counts_as_staff(self) -> None:
        self._place(self.customer)
        self._place(self.other)
        listed = self._call(LIST, 'get', self.staff)
        rows = listed.data['results'] if isinstance(listed.data, dict) else listed.data
        self.assertEqual(len(rows), 2)
        self.assertTrue(is_staff_user(self.staff))
        self.assertFalse(is_staff_user(self.customer))

    def test_shared_data_is_read_by_anyone_and_written_by_staff(self) -> None:
        rule = IsStaffOrReadOnly()
        for method, user, allowed in (('get', None, True), ('post', None, False), ('post', 'customer', False),
                                      ('post', 'staff', True)):
            request = getattr(self.factory, method)('/x/')
            request.user = {'customer': self.customer, 'staff': self.staff}.get(user or '', None)
            if request.user is None:
                from django.contrib.auth.models import AnonymousUser
                request.user = AnonymousUser()
            self.assertEqual(rule.has_permission(request, None), allowed, (method, user))
