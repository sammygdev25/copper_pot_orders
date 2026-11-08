from django.urls import re_path
from api import consumers

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", consumers.NotificationConsumer.as_asgi()),
    re_path(r"ws/room/(?P<room_id>[\w.-]+)/$", consumers.RoomConsumer.as_asgi()),
]
