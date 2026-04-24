from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from academics.models import Course, Lecture, LectureSession, AttendanceRecord, AttendanceReview
from students.models import Student
from .serializers import (
    CourseSerializer, LectureSerializer, LectureSessionSerializer,
    AttendanceRecordSerializer, AttendanceReviewSerializer, StudentStatsSerializer
)

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    queryset = Course.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Course.objects.all()
        return Course.objects.filter(instructor=user)

    @action(detail=True, methods=['get'])
    def lectures(self, request, pk=None):
        course = self.get_object()
        lectures = course.lectures.all()
        serializer = LectureSerializer(lectures, many=True)
        return Response(serializer.data)

class LectureViewSet(viewsets.ModelViewSet):
    serializer_class = LectureSerializer
    permission_classes = [IsAuthenticated]
    queryset = Lecture.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Lecture.objects.all()
        return Lecture.objects.filter(course__instructor=user)

    @action(detail=True, methods=['get'])
    def sessions(self, request, pk=None):
        lecture = self.get_object()
        sessions = lecture.sessions.all()
        serializer = LectureSessionSerializer(sessions, many=True)
        return Response(serializer.data)

class LectureSessionViewSet(viewsets.ModelViewSet):
    serializer_class = LectureSessionSerializer
    permission_classes = [IsAuthenticated]
    queryset = LectureSession.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return LectureSession.objects.all()
        return LectureSession.objects.filter(lecture__course__instructor=user)

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        session = self.get_object()
        records = session.attendance_records.all()
        serializer = AttendanceRecordSerializer(records, many=True)
        return Response(serializer.data)

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
    queryset = AttendanceRecord.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return AttendanceRecord.objects.all()
        return AttendanceRecord.objects.filter(
            lecture_session__lecture__course__instructor=user
        )

    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_bulk(self, request):
        """Mark attendance for multiple students in a session"""
        session_id = request.data.get('session_id')
        attendance_data = request.data.get('attendance', [])

        if not session_id or not attendance_data:
            return Response(
                {'error': 'session_id and attendance data required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = LectureSession.objects.get(id=session_id)
            # Check permissions
            if request.user.role != 'ADMIN' and session.lecture.course.instructor != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except LectureSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        created_records = []
        for item in attendance_data:
            student_id = item.get('student_id')
            hit_1 = item.get('hit_1', False)
            hit_2 = item.get('hit_2', False)
            hit_3 = item.get('hit_3', False)
            notes = item.get('notes', '')
            
            # Derive status: Present if at least 2 hits are True
            hits_count = sum([hit_1, hit_2, hit_3])
            status_value = 'Present' if hits_count >= 2 else 'Absent'

            try:
                student = Student.objects.get(id=student_id)
                # Check if record already exists
                record, created = AttendanceRecord.objects.get_or_create(
                    student=student,
                    lecture_session=session,
                    defaults={
                        'status': status_value,
                        'hit_1': hit_1,
                        'hit_2': hit_2,
                        'hit_3': hit_3,
                        'marked_by': request.user,
                        'notes': notes
                    }
                )
                if not created:
                    record.status = status_value
                    record.hit_1 = hit_1
                    record.hit_2 = hit_2
                    record.hit_3 = hit_3
                    record.marked_by = request.user
                    record.notes = notes
                    record.save()

                created_records.append(record)
            except Student.DoesNotExist:
                continue

        serializer = AttendanceRecordSerializer(created_records, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Faculty review of attendance record"""
        record = self.get_object()
        is_approved = request.data.get('is_approved', True)
        comments = request.data.get('comments', '')

        # Check permissions
        if request.user.role != 'ADMIN' and record.lecture_session.lecture.course.instructor != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        review, created = AttendanceReview.objects.get_or_create(
            attendance_record=record,
            defaults={
                'reviewed_by': request.user,
                'is_approved': is_approved,
                'comments': comments
            }
        )

        if not created:
            review.reviewed_by = request.user
            review.is_approved = is_approved
            review.comments = comments
            review.save()

        serializer = AttendanceReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AttendanceReviewViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceReviewSerializer
    permission_classes = [IsAuthenticated]
    queryset = AttendanceReview.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return AttendanceReview.objects.all()
        return AttendanceReview.objects.filter(
            attendance_record__lecture_session__lecture__course__instructor=user
        )

class StudentStatsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get attendance statistics for a student"""
        try:
            student = Student.objects.get(id=pk)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all courses the student is enrolled in
        courses = student.courses_enrolled.all()
        stats_data = []

        for course in courses:
            # Get all sessions for this course
            sessions = LectureSession.objects.filter(lecture__course=course)
            total_sessions = sessions.count()

            if total_sessions == 0:
                continue

            # Get attendance records for this student in this course
            records = AttendanceRecord.objects.filter(
                student=student,
                lecture_session__lecture__course=course
            )

            present_count = records.filter(status='Present').count()
            absent_count = records.filter(status='Absent').count()
            excused_count = records.filter(status='Excused').count()
            attendance_percentage = round((present_count / total_sessions) * 100, 1)

            stats_data.append({
                'student': StudentSerializer(student).data,
                'course_id': course.id,
                'course_code': course.code,
                'course_name': course.name,
                'total_sessions': total_sessions,
                'present_count': present_count,
                'absent_count': absent_count,
                'excused_count': excused_count,
                'attendance_percentage': attendance_percentage,
                'attendance_hits': records.count()
            })

        serializer = StudentStatsSerializer(stats_data, many=True)
        return Response(serializer.data)