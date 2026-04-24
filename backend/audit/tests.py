from django.test import TestCase
from .models import AuditLog
from users.models import CustomUser

class AuditLogTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(username='testadmin', password='testpassword', role='ADMIN')

    def test_audit_log_immutability(self):
        # Create an audit log
        log = AuditLog.objects.create(user=self.user, action="POST /admin/", ip_address="127.0.0.1")
        
        # Test update fails
        with self.assertRaises(ValueError):
            log.action = "Modified"
            log.save()
            
        # Test delete fails
        with self.assertRaises(ValueError):
            log.delete()
