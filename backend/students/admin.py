from django.contrib import admin
from .models import Student, BiometricEmbedding

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('enrollment_id', 'name', 'is_active')
    search_fields = ('enrollment_id', 'name')

@admin.register(BiometricEmbedding)
class BiometricEmbeddingAdmin(admin.ModelAdmin):
    list_display = ('student', 'consent_provided', 'updated_at')
    search_fields = ('student__enrollment_id',)
