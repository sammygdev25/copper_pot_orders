"""The payment module's guarantees, on this app's own order model: run with python manage.py test payments."""
import hashlib
import hmac
import json
import time
import uuid
from datetime import date, time as clock
from decimal import Decimal
from typing import Any
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.db import models
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import StripeEvent
from .order import AMOUNT_FIELD, OWNER_FIELD, PAID_FLAG, PAID_STATUS, STATUS_FIELD, order_model

SECRET = 'test-webhook-secret'
KEYS = {'STRIPE_SECRET_KEY': 'test-key-not-real', 'STRIPE_WEBHOOK_SECRET': SECRET, 'STRIPE_CURRENCY': 'usd'}
User = get_user_model()


def _user() -> Any:
    name = 'u' + uuid.uuid4().hex[:10]
    return User.objects.create_user(username=name, email=name + '@example.com', password=uuid.uuid4().hex)


def _value(field: models.Field) -> Any:
    """A valid value for a required field the test does not care about."""
    if field.choices:
        return field.choices[0][0]
    if isinstance(field, (models.ForeignKey, models.OneToOneField)):
        target = field.related_model
        return _user() if target is User else _row(target)
    for kind, value in ((models.BooleanField, False), (models.DecimalField, Decimal('1')), (models.FloatField, 1.0),
                        (models.IntegerField, 1), (models.DateTimeField, timezone.now()), (models.DateField, date.today()),
                        (models.TimeField, clock(12, 0)), (models.EmailField, uuid.uuid4().hex[:12] + '@example.com'),
                        (models.UUIDField, uuid.uuid4()), (models.JSONField, {}), (models.FileField, 'test.png')):
        if isinstance(field, kind):
            return value
    return uuid.uuid4().hex[:min(12, field.max_length or 12)]


def _row(model: type[models.Model], **given: Any) -> models.Model:
    values = dict(given)
    for field in model._meta.concrete_fields:
        if field.primary_key or field.name in values or field.null or field.has_default():
            continue
        if getattr(field, 'auto_now', False) or getattr(field, 'auto_now_add', False):
            continue
        if field.blank and isinstance(field, (models.CharField, models.TextField)):
            continue
        values[field.name] = _value(field)
    return model.objects.create(**values)


def _order(owner: Any, total: str = '12.50') -> models.Model:
    row = _row(order_model(), **({OWNER_FIELD: owner} if OWNER_FIELD else {}))
    order_model().objects.filter(pk=row.pk).update(**{AMOUNT_FIELD: Decimal(total)})
    return order_model().objects.get(pk=row.pk)


def _signed(payload: dict) -> tuple:
    body = json.dumps(payload)
    stamp = int(time.time())
    digest = hmac.new(SECRET.encode(), ('%d.%s' % (stamp, body)).encode(), hashlib.sha256).hexdigest()
    return body, 't=%d,v1=%s' % (stamp, digest)


def _paid_event(order: models.Model, session_id: str, cents: int, event_id: str = '') -> dict:
    session = {'id': session_id, 'object': 'checkout.session', 'payment_status': 'paid', 'amount_total': cents,
               'currency': 'usd', 'client_reference_id': str(order.pk), 'metadata': {'orderId': str(order.pk)}}
    return {'id': event_id or 'evt_' + uuid.uuid4().hex, 'object': 'event', 'type': 'checkout.session.completed',
            'data': {'object': session}}


@override_settings(**KEYS)
class PaymentTests(TestCase):
    def setUp(self) -> None:
        self.user = _user()
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.user)
        self.order = _order(self.user)

    def _post_event(self, payload: dict, signature: str = '') -> Any:
        body, signed = _signed(payload)
        return self.client.post('/api/payments/webhook/', data=body, content_type='application/json',
                                HTTP_STRIPE_SIGNATURE=signature or signed)

    def _attach_session(self, session_id: str) -> None:
        order_model().objects.filter(pk=self.order.pk).update(stripe_session_id=session_id)

    @override_settings(STRIPE_SECRET_KEY='')
    def test_no_key_answers_503(self) -> None:
        res = self.client_api.post('/api/payments/checkout/', {'orderId': self.order.pk}, format='json')
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.json()['code'], 'payments_unavailable')

    def test_checkout_charges_the_stored_total(self) -> None:
        session = {'id': 'cs_test_1', 'url': 'https://checkout.stripe.com/c/cs_test_1'}
        with mock.patch('stripe.checkout.Session.create', return_value=session) as create:
            res = self.client_api.post('/api/payments/checkout/', {'orderId': self.order.pk}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {'url': session['url'], 'sessionId': 'cs_test_1'})
        self.assertEqual(create.call_args.kwargs['line_items'][0]['price_data']['unit_amount'], 1250)
        self.assertEqual(order_model().objects.get(pk=self.order.pk).stripe_session_id, 'cs_test_1')

    def test_an_open_session_is_reused(self) -> None:
        self._attach_session('cs_open')
        open_session = {'id': 'cs_open', 'url': 'https://checkout.stripe.com/c/cs_open', 'status': 'open', 'amount_total': 1250}
        with mock.patch('stripe.checkout.Session.retrieve', return_value=open_session), \
                mock.patch('stripe.checkout.Session.create') as create:
            res = self.client_api.post('/api/payments/checkout/', {'orderId': self.order.pk}, format='json')
        self.assertEqual(res.json()['sessionId'], 'cs_open')
        create.assert_not_called()

    def test_another_users_order_is_not_found(self) -> None:
        if not OWNER_FIELD:
            self.skipTest('the order has no owner field')
        other = APIClient()
        other.force_authenticate(_user())
        self.assertEqual(other.post('/api/payments/checkout/', {'orderId': self.order.pk}, format='json').status_code, 404)
        self.assertEqual(other.get('/api/payments/order/', {'order': self.order.pk}).status_code, 404)
        self.assertEqual(other.get('/api/payments/unpaid/').json(), [])

    def test_bad_signature_is_refused(self) -> None:
        self._attach_session('cs_sig')
        res = self._post_event(_paid_event(self.order, 'cs_sig', 1250), signature='t=1,v1=forged')
        self.assertEqual(res.status_code, 400)
        self.assertIsNone(order_model().objects.get(pk=self.order.pk).paid_at)

    def test_paid_event_marks_the_order_paid_once(self) -> None:
        self._attach_session('cs_paid')
        event = _paid_event(self.order, 'cs_paid', 1250, 'evt_once')
        with mock.patch('payments.views.on_order_paid') as fulfill:
            self.assertEqual(self._post_event(event).status_code, 200)
            self.assertEqual(self._post_event(event).status_code, 200)
        order = order_model().objects.get(pk=self.order.pk)
        self.assertIsNotNone(order.paid_at)
        if STATUS_FIELD:
            self.assertEqual(getattr(order, STATUS_FIELD), PAID_STATUS)
        if PAID_FLAG:
            self.assertTrue(getattr(order, PAID_FLAG))
        self.assertEqual(fulfill.call_count, 1)
        self.assertEqual(StripeEvent.objects.filter(event_id='evt_once').count(), 1)
        self.assertEqual(self.client_api.get('/api/payments/status/', {'session_id': 'cs_paid'}).json(),
                         {'orderId': self.order.pk, 'paid': True})

    def test_a_wrong_amount_or_session_is_not_marked_paid(self) -> None:
        self._attach_session('cs_amount')
        self.assertEqual(self._post_event(_paid_event(self.order, 'cs_amount', 100)).status_code, 200)
        self.assertEqual(self._post_event(_paid_event(self.order, 'cs_other', 1250)).status_code, 200)
        self.assertIsNone(order_model().objects.get(pk=self.order.pk).paid_at)

    def test_a_failed_fulfillment_rolls_back_and_retries(self) -> None:
        self._attach_session('cs_retry')
        event = _paid_event(self.order, 'cs_retry', 1250, 'evt_retry')
        with mock.patch('payments.views.on_order_paid', side_effect=RuntimeError('effect failed')):
            self.assertEqual(self._post_event(event).status_code, 500)
        self.assertIsNone(order_model().objects.get(pk=self.order.pk).paid_at)
        self.assertFalse(StripeEvent.objects.filter(event_id='evt_retry').exists())
        self.assertEqual(self._post_event(event).status_code, 200)
        self.assertIsNotNone(order_model().objects.get(pk=self.order.pk).paid_at)

    def test_nothing_but_the_webhook_marks_an_order_paid(self) -> None:
        order = order_model().objects.get(pk=self.order.pk)
        order.paid_at = timezone.now()
        with self.assertRaises(PermissionDenied):
            order.save()
        order = order_model().objects.get(pk=self.order.pk)
        order.stripe_session_id = 'cs_forged'
        with self.assertRaises(PermissionDenied):
            order.save()
        if STATUS_FIELD:
            order = order_model().objects.get(pk=self.order.pk)
            setattr(order, STATUS_FIELD, PAID_STATUS)
            with self.assertRaises(PermissionDenied):
                order.save()
        if PAID_FLAG:
            order = order_model().objects.get(pk=self.order.pk)
            setattr(order, PAID_FLAG, True)
            with self.assertRaises(PermissionDenied):
                order.save()
        with self.assertRaises(PermissionDenied):
            _row(order_model(), paid_at=timezone.now(), **({OWNER_FIELD: self.user} if OWNER_FIELD else {}))

    def test_other_saves_still_work(self) -> None:
        order = order_model().objects.get(pk=self.order.pk)
        order.save()
        order.save(update_fields=[AMOUNT_FIELD])

    def test_reads_answer_the_shared_shapes(self) -> None:
        self.assertEqual(self.client_api.get('/api/payments/order/', {'order': self.order.pk}).json(),
                         {'id': self.order.pk, 'amount': 12.5, 'paid': False})
        unpaid = self.client_api.get('/api/payments/unpaid/').json()
        self.assertEqual(unpaid, [{'id': self.order.pk, 'amount': 12.5}] if OWNER_FIELD else [])
        self.assertEqual(APIClient().get('/api/payments/unpaid/').status_code, 401)
