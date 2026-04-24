from rest_framework import serializers
from .models import Student, BiometricEmbedding

class BiometricSerializer(serializers.ModelSerializer):
    embedding = serializers.ListField(
        child=serializers.FloatField(),
        min_length=512,
        max_length=512
    )

    class Meta:
        model = BiometricEmbedding
        fields = ['embedding']

class StudentSerializer(serializers.ModelSerializer):
    biometrics = BiometricSerializer(read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'enrollment_id', 'name', 'is_active', 'biometrics']

class BiometricEnrollSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True)
    consent = serializers.BooleanField(required=True)

