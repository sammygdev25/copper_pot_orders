"""api/payments/: hosted Stripe Checkout for one order of the signed-in user, the webhook that marks it paid, and the
reads the pay pages use. The same calls and reply shapes as the Express module, so the frontend files are shared.
Keys come from the environment only; with no STRIPE_SECRET_KEY these routes answer 503 and the rest of the app runs."""
import json
import logging
from typing import Any, Optional

import stripe
from django.conf import settings
from django.db import IntegrityError, transaction
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .fulfill import on_order_paid
from .guard import payment_writer
from .models import StripeEvent
from .order import OWNER_FIELD, PAID_FLAG, PAID_STATUS, STATUS_FIELD, amount, amount_cents, order_model, owned_orders

logger = logging.getLogger(__name__)
PAID_EVENTS = ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
UNAVAILABLE = {'error': 'Payments are not set up yet', 'code': 'payments_unavailable'}


def _positive_int(value: Any) -> Optional[int]:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value > 0 else None
    text = str(value or '').strip()
    return int(text) if text.isdigit() and int(text) > 0 else None


def _site_origin(request: Request) -> str:
    """Where Stripe sends the browser back: the request's origin when CORS allows it, else FRONTEND_URL, else this host."""
    origin = request.headers.get('Origin', '').rstrip('/')
    allowed = getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False) or origin in getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    if origin and allowed:
        return origin
    if settings.FRONTEND_URL:
        return settings.FRONTEND_URL.rstrip('/')
    return request.build_absolute_uri('/').rstrip('/')


def _open_session(order: Any) -> Optional[Any]:
    """The order's Checkout Session when it is still open, so a second click does not start a second charge."""
    if not order.stripe_session_id:
        return None
    try:
        session = stripe.checkout.Session.retrieve(order.stripe_session_id, api_key=settings.STRIPE_SECRET_KEY)
    except stripe.StripeError:
        return None
    return session if session['status'] == 'open' and session['amount_total'] == amount_cents(order) else None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request: Request) -> Response:
    """POST {orderId}: a hosted Stripe Checkout Session for one unpaid order of the caller, for the order's total as
    the database holds it."""
    if not settings.STRIPE_SECRET_KEY:
        return Response(UNAVAILABLE, status=503)
    order_id = _positive_int(request.data.get('orderId'))
    if order_id is None:
        return Response({'error': 'orderId is required', 'code': 'validation_error'}, status=400)
    order = owned_orders(request.user).filter(pk=order_id).first()
    if order is None:
        return Response({'error': 'Order not found'}, status=404)
    if order.paid_at:
        return Response({'error': 'Already paid', 'code': 'already_paid'}, status=409)
    cents = amount_cents(order)
    if cents < 50:
        return Response({'error': 'Amount too small to charge', 'code': 'amount_too_small'}, status=400)
    session = _open_session(order)
    if session is None:
        origin = _site_origin(request)
        try:
            session = stripe.checkout.Session.create(
                api_key=settings.STRIPE_SECRET_KEY,
                mode='payment',
                line_items=[{'quantity': 1, 'price_data': {
                    'currency': settings.STRIPE_CURRENCY, 'unit_amount': cents,
                    'product_data': {'name': 'Order #%s' % order.pk}}}],
                client_reference_id=str(order.pk),
                metadata={'orderId': str(order.pk)},
                success_url=origin + '/payment-success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='%s/payment-cancel?order=%s' % (origin, order.pk),
            )
        except stripe.StripeError:
            logger.warning('checkout for order %s failed at Stripe', order.pk)
            return Response({'error': 'Could not start the payment', 'code': 'checkout_failed'}, status=502)
        with payment_writer():
            order.stripe_session_id = session['id']
            order.save(update_fields=['stripe_session_id'])
        logger.info('checkout session %s created for order %s', session['id'], order.pk)
    return Response({'url': session['url'], 'sessionId': session['id']})


def _mark_paid(session: Any) -> None:
    """A paid Checkout Session marks its order paid when the order, the session and the amount all match."""
    if session.get('payment_status') != 'paid':
        return
    metadata = session.get('metadata') or {}
    order_id = _positive_int(metadata.get('orderId') or session.get('client_reference_id'))
    orders = order_model().objects.select_for_update()
    order = orders.filter(pk=order_id, stripe_session_id=session.get('id'), paid_at__isnull=True).first() if order_id else None
    if order is None:
        logger.info('session %s matches no unpaid order', session.get('id'))
        return
    currency = str(session.get('currency') or '').lower()
    if session.get('amount_total') != amount_cents(order) or currency != settings.STRIPE_CURRENCY.lower():
        logger.error('session %s paid %s %s but order %s costs %s; left unpaid for review',
                     session.get('id'), session.get('amount_total'), currency, order.pk, amount_cents(order))
        return
    order.paid_at = timezone.now()
    fields = ['paid_at']
    if STATUS_FIELD:
        setattr(order, STATUS_FIELD, PAID_STATUS)
        fields.append(STATUS_FIELD)
    if PAID_FLAG:
        setattr(order, PAID_FLAG, True)
        fields.append(PAID_FLAG)
    order.save(update_fields=fields)
    on_order_paid(order)
    logger.info('order %s paid by session %s', order.pk, session.get('id'))


@csrf_exempt
@require_POST
def webhook(request: HttpRequest) -> JsonResponse:
    """Stripe calls this. The signature on the raw body is checked first. The event id is written in the same
    transaction as its effect, so a replayed event changes nothing; a failed effect rolls both back and Stripe retries."""
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        return JsonResponse({'error': 'Webhook is not set up yet', 'code': 'payments_unavailable'}, status=503)
    signature = request.headers.get('Stripe-Signature', '')
    if not signature:
        return JsonResponse({'error': 'Missing signature', 'code': 'bad_signature'}, status=400)
    try:
        stripe.Webhook.construct_event(request.body, signature, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError):
        logger.warning('webhook signature rejected')
        return JsonResponse({'error': 'Invalid signature', 'code': 'bad_signature'}, status=400)
    # Read from the verified body as plain JSON: Stripe's objects stopped being dicts in later versions.
    event = json.loads(request.body)
    event_id, kind = event['id'], event['type']
    try:
        with transaction.atomic(), payment_writer():
            try:
                with transaction.atomic():
                    StripeEvent.objects.create(event_id=event_id, type=kind)
            except IntegrityError:
                logger.info('event %s already applied', event_id)
                return JsonResponse({'received': True})
            if kind in PAID_EVENTS:
                _mark_paid(event['data']['object'])
    except Exception:
        logger.exception('event %s failed', event_id)
        return JsonResponse({'error': 'Fulfillment failed', 'code': 'fulfillment_failed'}, status=500)
    return JsonResponse({'received': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status(request: Request) -> Response:
    """GET ?session_id=: the success page asks whether the webhook has marked the order paid."""
    session_id = str(request.query_params.get('session_id') or '')
    if not session_id:
        return Response({'error': 'session_id is required', 'code': 'validation_error'}, status=400)
    order = owned_orders(request.user).filter(stripe_session_id=session_id).first()
    if order is None:
        return Response({'error': 'Order not found'}, status=404)
    return Response({'orderId': order.pk, 'paid': bool(order.paid_at)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order(request: Request) -> Response:
    """GET ?order=<id>: the pay page reads one order of the caller, its amount and whether it is paid."""
    order_id = _positive_int(request.query_params.get('order'))
    if order_id is None:
        return Response({'error': 'order is required', 'code': 'validation_error'}, status=400)
    row = owned_orders(request.user).filter(pk=order_id).first()
    if row is None:
        return Response({'error': 'Order not found'}, status=404)
    return Response({'id': row.pk, 'amount': float(amount(row)), 'paid': bool(row.paid_at)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unpaid(request: Request) -> Response:
    """GET: the caller's orders not yet paid, newest first, for the notice above every page. None when the order has
    no owner field: no row is the caller's to show."""
    if not OWNER_FIELD:
        return Response([])
    rows = owned_orders(request.user).filter(paid_at__isnull=True).order_by('-pk')[:5]
    return Response([{'id': row.pk, 'amount': float(amount(row))} for row in rows])
