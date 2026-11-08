from rest_framework import serializers
from api.models import MenuItem, Category

# Order / OrderItem serializers are owned by api.order_flow — import from there,
# never redefine them here.
from api.order_flow import OrderSerializer, OrderItemSerializer  # noqa: F401


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'created_at']


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'price', 'category', 'category_name',
            'image', 'is_available', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    image = serializers.SerializerMethodField()
    def get_image(self, obj):
        val = getattr(obj, 'image', None)
        if not val:
            return None
        val_str = str(val)
        if val_str.startswith(('http', 'data:', '/')):
            return val_str
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(val.url)
        return val.url