from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from academics.models import LectureSession, Student
from django.shortcuts import get_object_or_404
import random
import time

class ActiveSessionLiveAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(LectureSession, id=session_id)
        
        # In a production environment, this would pull from Redis/Kafka
        # For the demo, we will simulate live detections from the student list
        students = session.lecture.course.students.all()
        
        if not students.exists():
            return Response({"detections": [], "stats": {"focused": 100, "mood": "Neutral"}})

        # Pick 2-3 random students as "Recently Detected"
        sample_count = min(3, students.count())
        detected_students = random.sample(list(students), sample_count)
        
        emotions = ['Focused', 'Happy', 'Neutral', 'Bored', 'Confused']
        
        detections = []
        for student in detected_students:
            detections.append({
                "student_id": student.enrollment_id,
                "name": student.name,
                "sentiment": random.choice(emotions),
                "confidence": round(random.uniform(0.85, 0.99), 2),
                "timestamp": time.time()
            })

        return Response({
            "session_id": session_id,
            "course": session.lecture.course.code,
            "detections": detections,
            "stats": {
                "present_count": random.randint(15, 30),
                "total_count": students.count(),
                "avg_sentiment": random.choice(emotions),
                "sentiment_score": random.randint(70, 95)
            }
        })
