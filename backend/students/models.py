from django.db import models


class Student(models.Model):
    enrollment_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['enrollment_id']

    def __str__(self):
        return f"{self.enrollment_id} - {self.name}"


class BiometricEmbedding(models.Model):
    """Face embedding vector stored as JSON array (512 floats).
    Using JSONField instead of postgres ArrayField so it works with SQLite in dev.
    """
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='biometrics')
    # JSONField stores the 512-float embedding as a JSON array — compatible with SQLite + PostgreSQL
    embedding = models.JSONField(null=True, blank=True)
    consent_provided = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Biometrics for {self.student.enrollment_id}"
