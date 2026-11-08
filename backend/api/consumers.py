import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    """User-scoped notification consumer."""

    async def connect(self):
        self.user = self.scope["user"]
        self.group_name = (
            f"user_{self.user.id}"
            if self.user.is_authenticated
            else "anonymous"
        )
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "notification_message", "message": data},
        )

    async def notification_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))


class RoomConsumer(AsyncWebsocketConsumer):
    """
    Room-based broadcast consumer for real-time features.

    Clients join a room by connecting to ws/room/<room_id>/.
    Any message sent by one client is broadcast to all others in the room.

    Use cases:
      - Ride tracking: room_id = ride_<id>, driver sends GPS, rider sees map update
      - Delivery tracking: room_id = order_<id>
      - Chat rooms: room_id = chat_<id>
      - Live dashboards: room_id = dashboard_<id>
      - Collaborative editing: room_id = doc_<id>

    Message format (send any JSON, it gets broadcast to the room):
      {"type": "location_update", "latitude": 37.77, "longitude": -122.41}
      {"type": "status_change", "status": "picked_up"}
      {"type": "chat_message", "text": "On my way!", "sender": "driver"}
    """

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group = f"room_{self.room_id}"
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()
        # Notify room that someone joined
        await self.channel_layer.group_send(
            self.room_group,
            {"type": "room_event", "data": {
                "type": "user_joined",
                "user": str(getattr(self.scope.get("user"), "id", "anonymous")),
            }},
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group,
            {"type": "room_event", "data": {
                "type": "user_left",
                "user": str(getattr(self.scope.get("user"), "id", "anonymous")),
            }},
        )
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group,
            {"type": "room_event", "data": data},
        )

    async def room_event(self, event):
        await self.send(text_data=json.dumps(event["data"]))
