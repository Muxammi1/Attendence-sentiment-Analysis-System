import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings_local')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'
ADMIN_EMAIL = 'admin@iqra.edu.pk'

user, created = User.objects.get_or_create(
    username=ADMIN_USERNAME,
    defaults={
        'email': ADMIN_EMAIL,
        'first_name': 'System',
        'last_name': 'Admin',
        'is_staff': True,
        'is_superuser': True,
        'role': 'ADMIN',
    }
)

user.set_password(ADMIN_PASSWORD)
user.is_staff = True
user.is_superuser = True
user.role = 'ADMIN'
user.save()

action = 'Created' if created else 'Reset'
print(f"✅ {action} admin user:")
print(f"   Username : {ADMIN_USERNAME}")
print(f"   Password : {ADMIN_PASSWORD}")
print(f"   Role     : {user.role}")
print(f"   Staff    : {user.is_staff}")
print()
print("You can now log in at http://localhost:5173 or http://localhost:8000/admin/")
