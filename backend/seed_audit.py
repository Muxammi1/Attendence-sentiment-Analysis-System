import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from audit.models import AuditLog
from django.contrib.auth import get_user_model
User = get_user_model()

admin = User.objects.get(username='admin')

logs = [
    {"action": "Attendance Override", "ip_address": "127.0.0.1"},
    {"action": "Faculty Login", "ip_address": "192.168.1.45"},
    {"action": "Session Started", "ip_address": "10.0.0.5"},
    {"action": "Biometric Enrolled", "ip_address": "127.0.0.1"},
    {"action": "Course Archived", "ip_address": "127.0.0.1"},
]

for log in logs:
    AuditLog.objects.create(user=admin, action=log['action'], ip_address=log['ip_address'])

print(f"Created {len(logs)} audit logs.")
