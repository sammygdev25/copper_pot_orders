"""Only Stripe marks an order paid. Every save of the order model passes here: setting paid_at, stripe_session_id or the paid flag,
or the status to paid, outside payment_writer() (the payments views) is refused with a 403, whether it comes from a
view, a serializer, the admin or a shell. Fixture loads pass: the seed is the developer's, not a request. A queryset
update() skips model saves; the generator's validator reports any file outside payments/ that writes these fields."""
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any, Iterator, Optional

from django.core.exceptions import PermissionDenied
from django.db import models

from .order import PAID_FLAG, PAID_STATUS, STATUS_FIELD

GUARDED = ('paid_at', 'stripe_session_id') + ((PAID_FLAG,) if PAID_FLAG else ())
REFUSED = 'Only a Stripe payment marks an order paid.'
_WRITER: ContextVar[bool] = ContextVar('payments_writer', default=False)


@contextmanager
def payment_writer() -> Iterator[None]:
    """The payments views' context: inside it the order's payment fields may change."""
    token = _WRITER.set(True)
    try:
        yield
    finally:
        _WRITER.reset(token)


def _changes_payment(instance: models.Model, before: Optional[dict], fields: tuple) -> bool:
    for name in fields:
        now = getattr(instance, name)
        if before is None:
            if now not in (None, '', False):
                return True
        elif now != before[name]:
            return True
    return False


def refuse_paid_outside_webhook(sender: type[models.Model], instance: models.Model, raw: bool = False,
                                update_fields: Any = None, **kwargs: Any) -> None:
    if raw or _WRITER.get():
        return
    names = tuple(update_fields) if update_fields is not None else None
    guarded = tuple(f for f in GUARDED if names is None or f in names)
    status = STATUS_FIELD if STATUS_FIELD and (names is None or STATUS_FIELD in names) else ''
    if not guarded and not status:
        return
    before = None
    if instance.pk is not None:
        columns = GUARDED + ((STATUS_FIELD,) if STATUS_FIELD else ())
        before = sender.objects.filter(pk=instance.pk).values(*columns).first()
    if _changes_payment(instance, before, guarded):
        raise PermissionDenied(REFUSED)
    if status and getattr(instance, status) == PAID_STATUS and (before is None or before[status] != PAID_STATUS):
        raise PermissionDenied(REFUSED)
