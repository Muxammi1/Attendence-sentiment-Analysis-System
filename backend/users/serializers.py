from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': False, 'allow_blank': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', 'faculty123')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

