import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

try:
    u = User.objects.get(username='admin')
    u.set_password('admin123')
    u.is_active = True
    u.is_staff = True
    u.is_superuser = True
    u.role = 'ADMIN'
    u.save()
    print(f"User 'admin' updated: is_active={u.is_active}, role={u.role}")
except User.DoesNotExist:
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='ADMIN')
    print("Superuser 'admin' created with password 'admin123' and role 'ADMIN'")
