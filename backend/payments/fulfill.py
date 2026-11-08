"""The app's effect of a paid order."""
import logging

from django.db import models

logger = logging.getLogger(__name__)


def on_order_paid(order: models.Model) -> None:
    """Called by the verified webhook only, once per order, inside the transaction that marks it paid: an exception
    here rolls the paid mark back and Stripe retries the event. Never call this from a view or a page."""
    logger.info('order %s paid, no fulfillment effect configured', order.pk)
