from django.test import TestCase
from .serializers import BiometricSerializer

class BiometricSerializerTest(TestCase):
    def test_invalid_array_length(self):
        # 511 dimensions
        data = {'embedding': [0.5] * 511}
        serializer = BiometricSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('embedding', serializer.errors)
        
        # 513 dimensions
        data = {'embedding': [0.5] * 513}
        serializer = BiometricSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('embedding', serializer.errors)
        
    def test_valid_array_length(self):
        # exactly 512
        data = {'embedding': [0.5] * 512}
        serializer = BiometricSerializer(data=data)
        self.assertTrue(serializer.is_valid())
