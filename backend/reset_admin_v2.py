import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = 'admin'
password = 'admin123'

u = User.objects.get(username=username)
u.set_password(password)
u.save()
print(f"Password for '{username}' reset to '{password}'")
