"""Who may do what, written by Shikshya from the plan. Staff are users with is_staff, or with one of the plan's staff
roles in its role field. Shared data (a menu, categories, a catalog) is read by anyone and written by staff only."""
from typing import Any

from rest_framework import permissions
from rest_framework.request import Request

ROLE_FIELD = ''
STAFF_ROLES = ()


def is_staff_user(user: Any) -> bool:
    """True for a signed-in user with is_staff or superuser, or with one of the plan's staff roles."""
    if user is None or not getattr(user, 'is_authenticated', False):
        return False
    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return True
    return bool(ROLE_FIELD) and getattr(user, ROLE_FIELD, None) in STAFF_ROLES


class IsStaff(permissions.BasePermission):
    """Staff only, for every method."""
    message = 'Only staff can do this.'

    def has_permission(self, request: Request, view: Any) -> bool:
        return is_staff_user(request.user)


class IsStaffOrReadOnly(permissions.BasePermission):
    """Anyone reads; only staff create, change or delete."""
    message = 'Only staff can change this.'

    def has_permission(self, request: Request, view: Any) -> bool:
        return request.method in permissions.SAFE_METHODS or is_staff_user(request.user)


class IsOwnerOrStaff(permissions.BasePermission):
    """A signed-in user reaches their own rows (the view's owner_field, 'user' by default); staff reach every row."""
    message = 'You can only reach your own records.'

    def has_permission(self, request: Request, view: Any) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request: Request, view: Any, obj: Any) -> bool:
        if is_staff_user(request.user):
            return True
        owner = getattr(view, 'owner_field', 'user')
        return getattr(obj, owner + '_id', None) == request.user.pk
