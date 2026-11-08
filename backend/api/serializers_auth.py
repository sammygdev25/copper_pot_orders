"""Auth serializers -- deterministic scaffold. Sign-up runs the project's password validators; the profile says the
user's role and whether they are staff (is_staff, or one of the plan's staff roles), both read only."""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()
ROLE_FIELD = ''
STAFF_ROLES = ()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, default='')
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def validate(self, attrs):
        candidate = User(**{k: attrs.get(k, '') for k in ('username', 'email', 'first_name', 'last_name')})
        try:
            validate_password(attrs['password'], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    date_joined = serializers.DateTimeField(read_only=True)
    role = serializers.SerializerMethodField()
    is_staff = serializers.SerializerMethodField()

    def get_role(self, obj):
        return getattr(obj, ROLE_FIELD, None) if ROLE_FIELD else None

    def get_is_staff(self, obj):
        role = getattr(obj, ROLE_FIELD, None) if ROLE_FIELD else None
        return bool(obj.is_staff or obj.is_superuser or role in STAFF_ROLES)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
