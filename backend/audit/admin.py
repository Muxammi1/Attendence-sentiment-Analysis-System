from django.contrib import admin
from .models import AuditLog

class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'ip_address')
    list_filter = ('timestamp', 'user')
    search_fields = ('action', 'ip_address')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

admin.site.register(AuditLog, AuditLogAdmin)
