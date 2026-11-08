"""Shipped with the module: the preview runs makemigrations for the api app only."""
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='StripeEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_id', models.CharField(max_length=255, unique=True)),
                ('type', models.CharField(max_length=100)),
                ('received_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
