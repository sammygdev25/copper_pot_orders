"""The model the payments module charges, written by the scaffold from the plan."""
from decimal import ROUND_HALF_UP, Decimal

from django.apps import apps
from django.db import models

ORDER_MODEL = 'api.Order'
AMOUNT_FIELD = 'total_amount'
# The link to the user that scopes every payment read; '' when the plan gave the order no single owner.
OWNER_FIELD = 'user'
# Set to PAID_STATUS together with paid_at; '' when the order has no status that can say paid.
STATUS_FIELD = ''
PAID_STATUS = 'paid'
# The plan's own paid flag (is_paid), set True with paid_at; '' when the order has none.
PAID_FLAG = ''


def order_model() -> type[models.Model]:
    return apps.get_model(ORDER_MODEL)


def owned_orders(user) -> models.QuerySet:
    """The orders the signed-in user may pay or read the payment of."""
    orders = order_model().objects.all()
    return orders.filter(**{OWNER_FIELD: user}) if OWNER_FIELD else orders


def amount(order: models.Model) -> Decimal:
    return Decimal(str(getattr(order, AMOUNT_FIELD) or 0))


def amount_cents(order: models.Model) -> int:
    """What Stripe charges, in the currency's smallest unit."""
    return int((amount(order) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
