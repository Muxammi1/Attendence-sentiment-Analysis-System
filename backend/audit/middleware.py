import json
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path.startswith('/admin/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            user = request.user if request.user.is_authenticated else None
            ip_address = request.META.get('REMOTE_ADDR')
            action = f"{request.method} {request.path}"
            
            # Simple logging placeholder for admin actions
            AuditLog.objects.create(
                user=user,
                action=action,
                ip_address=ip_address
            )
