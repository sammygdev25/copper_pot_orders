from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from api.models import Category, MenuItem
from api.serializers_menu import CategorySerializer, MenuItemSerializer
from api.permissions import IsStaffOrReadOnly  # Shikshya's permissions


class CategoryViewSet(viewsets.ModelViewSet):
    lookup_field = 'slug'
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = []
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all().select_related('category').order_by('category', 'name')
    serializer_class = MenuItemSerializer
    permission_classes = [IsStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = []
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'name', 'created_at']