"""The order routes: Shikshya's order flow (api/order_flow.py)."""
from api.order_flow import OrderFlowViewSet, OrderLineReadViewSet


class OrderViewSet(OrderFlowViewSet):
    """Orders are Shikshya's order flow (api/order_flow.py): priced on the server, status set by staff."""


class OrderItemViewSet(OrderLineReadViewSet):
    """Order lines are read here and written only with their order (api/order_flow.py)."""
