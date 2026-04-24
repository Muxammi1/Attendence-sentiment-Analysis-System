from django.db import models
from django.conf import settings

class AuditLog(models.fields.Field):
    pass # To avoid import error if used recursively
    
class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValueError("Audit logs are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Audit logs are immutable and cannot be deleted.")

    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action}"
