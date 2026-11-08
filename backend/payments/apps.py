"""The payments app: on start it puts the guard on every save of the order model."""
from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'payments'

    def ready(self) -> None:
        from django.db.models.signals import pre_save

        from .guard import refuse_paid_outside_webhook
        from .order import order_model

        pre_save.connect(refuse_paid_outside_webhook, sender=order_model(), dispatch_uid='payments.refuse_paid')
