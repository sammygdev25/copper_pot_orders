"""Stripe events already applied: the id is written in the transaction that applies the event, so a replay changes
nothing."""
from django.db import models


class StripeEvent(models.Model):
    event_id = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=100)
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.event_id
