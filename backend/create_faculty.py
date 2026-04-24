import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(username='faculty').exists():
    User.objects.create_user(
        username='faculty',
        email='faculty@example.com',
        password='faculty123',
        role='FACULTY',
        first_name='Dr.',
        last_name='Khurram'
    )
    print("Faculty user 'faculty' created with password 'faculty123'")
else:
    u = User.objects.get(username='faculty')
    u.set_password('faculty123')
    u.role = 'FACULTY'
    u.save()
    print("Faculty user 'faculty' updated.")
