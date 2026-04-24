from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Student, BiometricEmbedding
from .serializers import StudentSerializer, BiometricSerializer, BiometricEnrollSerializer
from cv_engine.faiss_service import FAISSIndexManager
from cv_engine.utils import face_extractor

faiss_manager = FAISSIndexManager()

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def enroll_biometrics(self, request, pk=None):
        student = self.get_object()
        serializer = BiometricEnrollSerializer(data=request.data)
        
        if serializer.is_valid():
            image_file = serializer.validated_data['image']
            consent = serializer.validated_data['consent']
            
            if not consent:
                return Response({"error": "Consent is required for biometric enrollment."}, status=status.HTTP_400_BAD_REQUEST)

            # Read image bytes and extract embedding
            image_bytes = image_file.read()
            embedding, error = face_extractor.extract_embedding(image_bytes)
            
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
            
            # Save to DB
            emb, created = BiometricEmbedding.objects.update_or_create(
                student=student,
                defaults={
                    'embedding': embedding,
                    'consent_provided': True
                }
            )
            
            # Sync to FAISS
            faiss_manager.add_embedding(student.id, embedding)
            
            return Response({
                "status": "biometrics enrolled", 
                "enrollment_id": student.enrollment_id,
                "embedding_preview": embedding[:5] # Return first 5 dimensions for verification
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

