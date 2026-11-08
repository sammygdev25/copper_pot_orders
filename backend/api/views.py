"""Views aggregator — explicit imports from domain view files."""
from .views_auth import CustomAuthToken, LogoutView, ProfileView, RegisterView  # noqa: F401
from .views_menu import CategoryViewSet, MenuItemViewSet  # noqa: F401
from .views_ordering import *  # noqa: F401,F403
from .views_order_flow import OrderViewSet, OrderItemViewSet  # noqa: F401
