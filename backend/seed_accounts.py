"""This app's demo sign-ins, set by start.sh after the seed data loads (SEED_DEMO=1 only).

The passwords are this app's own, made when it was generated: SEED_DEMO_PASSWORD, SEED_STAFF_PASSWORD and one
SEED_<ROLE>_PASSWORD per role, read from the environment or from backend/.env. The demo account, the staff account and
each role account get them; every other user (the seeded people who own the sample data) gets an unusable password, so
nobody can sign in as them. An account whose password is not set cannot sign in. No password is printed."""
import os
import re
from pathlib import Path

from django.contrib.auth import get_user_model

ROLE_FIELD = ''
ROLES = []
STAFF_FIELDS = {'is_staff': True}
KEY_RE = re.compile(r'^(SEED_[A-Z0-9_]+_PASSWORD)=(.*)$', re.M)


def passwords():
    """SEED_*_PASSWORD from backend/.env, then the environment on top (a deploy sets them as variables)."""
    found = {}
    env_file = Path('.env')
    if env_file.exists():
        for key, value in KEY_RE.findall(env_file.read_text(errors='replace')):
            found[key] = value.strip().strip('"').strip("'")
    for key, value in os.environ.items():
        if KEY_RE.match(key + '=') and value:
            found[key] = value
    return found


def role_key(role):
    return 'SEED_ROLE_DEMO_PASSWORD' if role.upper() == 'DEMO' else 'SEED_%s_PASSWORD' % role.upper()


def account(username, email, password, **fields):
    """The account by its sign-in name, made when missing, with this password or none."""
    User = get_user_model()
    login = email if User.USERNAME_FIELD == 'email' else username
    user = User.objects.filter(**{User.USERNAME_FIELD: login}).first() or User(**{User.USERNAME_FIELD: login})
    if User.USERNAME_FIELD != 'username' and hasattr(user, 'username') and not user.username:
        user.username = username
    if User.USERNAME_FIELD != 'email' and hasattr(user, 'email') and not user.email:
        user.email = email
    for name, value in fields.items():
        if hasattr(user, name):
            setattr(user, name, value)
    if password:
        user.set_password(password)
    else:
        user.set_unusable_password()
    user.save()
    return user


def main():
    User = get_user_model()
    found = passwords()
    wanted = [('demo', 'demo@example.com', found.get('SEED_DEMO_PASSWORD', ''), {}),
              ('staff', 'staff@example.com', found.get('SEED_STAFF_PASSWORD', ''), dict(STAFF_FIELDS))]
    for role in ROLES:
        name = role + '_user' if role == 'demo' else role
        wanted.append((name, name + '@example.com', found.get(role_key(role), ''), {ROLE_FIELD: role} if ROLE_FIELD else {}))
    kept, ready = [], []
    for username, email, password, fields in wanted:
        try:
            user = account(username, email, password, **fields)
        except Exception as exc:
            print('demo sign-in %s not set up: %s' % (username, type(exc).__name__))
            continue
        kept.append(user.pk)
        if user.has_usable_password():
            ready.append(username)
    for user in User.objects.exclude(pk__in=kept):
        user.set_unusable_password()
        user.save(update_fields=['password'])
    print('demo sign-ins: ' + (', '.join(ready) if ready else 'none (no SEED_*_PASSWORD is set)'))


main()