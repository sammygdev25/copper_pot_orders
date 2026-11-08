"""
Models for copper_pot_orders — auto-generated from ProjectContract.
DO NOT EDIT — regenerate from contract if changes needed.
"""
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return str(self.name)


class MenuItem(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    category = models.ForeignKey(to='Category', on_delete=models.CASCADE, related_name='menu_items')
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return str(self.name)


class Order(models.Model):
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    order_type = models.CharField(max_length=20, choices=[['pickup', 'Pickup'], ['delivery', 'Delivery']], default='pickup')
    status = models.CharField(max_length=20, choices=[['placed', 'Placed'], ['preparing', 'Preparing'], ['ready', 'Ready'], ['completed', 'Completed']], default='placed')
    customer_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255, blank=True)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    stripe_session_id = models.CharField(max_length=255, null=True, blank=True, unique=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return str(self.customer_name)


class OrderItem(models.Model):
    order = models.ForeignKey(to='Order', on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(to='MenuItem', on_delete=models.CASCADE, related_name='order_items')
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return str(self.menu_item)

