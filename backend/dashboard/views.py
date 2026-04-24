from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from academics.models import Course, LectureSession, AttendanceRecord, SentimentRecord, Lecture
from students.models import Student
from audit.models import AuditLog
from django.db.models import Count, Avg, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from cv_engine.tasks import start_cv_engine

class CourseDashboardAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = Course.objects.filter(instructor=request.user)
        data = [{"id": c.id, "code": c.code, "name": c.name} for c in courses]
        return Response(data)

class CourseDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id, instructor=request.user)
        sessions = course.sessions.all().order_by('session_number')
        
        session_data = []
        for session in sessions:
            attendances = AttendanceRecord.objects.filter(lecture_session=session)
            sentiments = SentimentRecord.objects.filter(lecture_session=session)
            
            att_list = [{"student": a.student.enrollment_id, "status": a.status, "id": a.id} for a in attendances]
            sent_list = [{"student": s.student.enrollment_id, "emotion": s.dominant_emotion, "score": s.confidence_score} for s in sentiments]
            
            session_data.append({
                "session_number": session.session_number,
                "date": session.date,
                "attendance": att_list,
                "sentiment": sent_list
            })
            
        return Response({
            "course": {"id": course.id, "code": course.code, "name": course.name},
            "sessions": session_data
        })

class StartSessionAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        print(f"DEBUG: StartSessionAPI called for session {session_id}")
        session = get_object_or_404(LectureSession, id=session_id, lecture__course__instructor=request.user)
        
        # Trigger CV Engine
        camera_id = "CAM-01" # Default for demo
        
        print(f"DEBUG: Triggering start_cv_engine for camera {camera_id}")
        try:
            start_cv_engine.delay(camera_id)
            status = "CV Engine started in background"
        except Exception as e:
            print(f"DEBUG: Celery not available, using thread fallback. Error: {e}")
            import threading
            thread = threading.Thread(target=start_cv_engine, args=(camera_id,))
            thread.daemon = True
            thread.start()
            status = "CV Engine started in a separate thread (Celery fallback)"

        print(f"DEBUG: StartSessionAPI response: {status}")
        return Response({
            "status": "success",
            "message": status,
            "session_id": session_id,
            "camera_id": camera_id
        })

class AttendanceOverrideAPI(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, record_id):
        record = get_object_or_404(AttendanceRecord, id=record_id, lecture_session__course__instructor=request.user)
        new_status = request.data.get("status")
        if new_status in dict(AttendanceRecord.STATUS_CHOICES):
            record.status = new_status
            record.save()
            return Response({"status": "success", "new_status": record.status})
        return Response({"error": "Invalid Status"}, status=400)


class AdminDashboardAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Admin access required"}, status=403)
        
        data = {
            "total_courses": Course.objects.count(),
            "total_students": Student.objects.count(),
            "live_sessions": LectureSession.objects.filter(date=timezone.now().date()).count(), # Simplified for now
            "alerts": [
                {"id": 1, "type": "camera", "message": "Room 4B camera signal weak", "time": "10:45 AM"},
                {"id": 2, "type": "system", "message": "Database backup completed", "time": "09:00 AM"},
            ],
            "audit_logs": [
                {
                    "time": log.timestamp.strftime("%H:%M"),
                    "action": log.action,
                    "detail": f"{log.user.username} · {log.ip_address or 'System'}",
                    "icon": "✏" if "Override" in log.action else "🔐" if "Login" in log.action else "➕"
                }
                for log in AuditLog.objects.select_related('user').order_by('-timestamp')[:5]
            ]
        }
        return Response(data)


class FacultyOverviewAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = Course.objects.filter(instructor=request.user)
        
        course_data = []
        for course in courses:
            total_lectures = 16 # Default constraint
            completed_lectures = Lecture.objects.filter(course=course, sessions__attendance_records__isnull=False).distinct().count()
            
            # Simple attendance average
            avg_attendance = AttendanceRecord.objects.filter(
                lecture_session__lecture__course=course,
                status='Present'
            ).count() / max(1, Student.objects.filter(courses_enrolled=course).count() * max(1, completed_lectures)) * 100

            course_data.append({
                "id": course.id,
                "code": course.code,
                "name": course.name,
                "progress": (completed_lectures / total_lectures) * 100,
                "avg_attendance": round(avg_attendance, 1),
                "lecture_status": f"{completed_lectures} / {total_lectures}"
            })

        # Mock at-risk students for now until we have more data
        at_risk = [
            {"id": 1, "name": "Ahmed Khan", "course": "CS-301", "absences": 5, "avatar": "AK"},
            {"id": 2, "name": "Sara Farooq", "course": "CS-205", "absences": 4, "avatar": "SF"},
        ]

        return Response({
            "courses": course_data,
            "at_risk": at_risk,
            "stats": {
                "present": 24,
                "partial": 4,
                "absent": 5,
                "unknown": 2
            }
        })

