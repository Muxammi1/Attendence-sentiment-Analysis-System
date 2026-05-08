import os
import sys
import django

# Use local settings (SQLite)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings_local')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = 'faculty'
password = 'faculty123'

user, created = User.objects.get_or_create(
    username=username,
    defaults={
        'email': 'faculty@iqra.edu.pk',
        'first_name': 'Dr.',
        'last_name': 'Khurram',
        'role': 'FACULTY',
        'is_staff': False
    }
)

user.set_password(password)
user.role = 'FACULTY' # Ensure role is correct if user already existed
user.save()

action = 'Created' if created else 'Updated'
print(f"✅ {action} faculty user:")
print(f"   Username : {username}")
print(f"   Password : {password}")
print(f"   Role     : {user.role}")
