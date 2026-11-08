"""Routed at api/payments/ by config/urls.py."""
from django.urls import path

from . import views

urlpatterns = [
    path('checkout/', views.checkout, name='payments-checkout'),
    path('webhook/', views.webhook, name='payments-webhook'),
    path('status/', views.status, name='payments-status'),
    path('order/', views.order, name='payments-order'),
    path('unpaid/', views.unpaid, name='payments-unpaid'),
]
