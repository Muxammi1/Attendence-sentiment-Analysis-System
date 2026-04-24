from rest_framework import serializers
from academics.models import Course, Lecture, LectureSession, AttendanceRecord, AttendanceReview
from students.models import Student

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'enrollment_id', 'name', 'email', 'phone']

class AttendanceReviewSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)

    class Meta:
        model = AttendanceReview
        fields = ['id', 'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'is_approved', 'comments']
        read_only_fields = ['reviewed_at']

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    lecture_session_id = serializers.IntegerField(write_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)
    review = AttendanceReviewSerializer(read_only=True)
    hits = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'student', 'student_id', 'lecture_session_id', 'status',
            'hit_1', 'hit_2', 'hit_3',
            'marked_by', 'marked_by_name', 'marked_at', 'updated_at',
            'notes', 'review', 'hits'
        ]
        read_only_fields = ['marked_at', 'updated_at']

    def get_hits(self, obj):
        # Count how many times this student's attendance was marked for this course
        return AttendanceRecord.objects.filter(
            student=obj.student,
            lecture_session__lecture__course=obj.lecture_session.lecture.course
        ).count()

class LectureSessionSerializer(serializers.ModelSerializer):
    attendance_records = AttendanceRecordSerializer(many=True, read_only=True)
    attendance_count = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()

    class Meta:
        model = LectureSession
        fields = [
            'id', 'lecture', 'session_number', 'date', 'start_time', 'end_time',
            'location', 'created_at', 'updated_at', 'attendance_records',
            'attendance_count', 'present_count'
        ]

    def get_attendance_count(self, obj):
        return obj.attendance_records.count()

    def get_present_count(self, obj):
        return obj.attendance_records.filter(status='Present').count()

class LectureSerializer(serializers.ModelSerializer):
    sessions = LectureSessionSerializer(many=True, read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Lecture
        fields = [
            'id', 'course', 'course_code', 'course_name', 'lecture_number',
            'title', 'description', 'created_at', 'sessions'
        ]

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    lectures = LectureSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()
    average_attendance = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'instructor', 'instructor_name',
            'students', 'lectures', 'student_count', 'total_sessions',
            'average_attendance', 'created_at', 'updated_at'
        ]

    def get_student_count(self, obj):
        return obj.students.count()

    def get_total_sessions(self, obj):
        return sum(lecture.sessions.count() for lecture in obj.lectures.all())

    def get_average_attendance(self, obj):
        total_sessions = self.get_total_sessions(obj)
        if total_sessions == 0:
            return 0
        total_present = sum(
            session.attendance_records.filter(status='Present').count()
            for lecture in obj.lectures.all()
            for session in lecture.sessions.all()
        )
        return round((total_present / (total_sessions * obj.students.count())) * 100, 1) if obj.students.count() > 0 else 0

class StudentStatsSerializer(serializers.Serializer):
    student = StudentSerializer()
    course_id = serializers.IntegerField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()
    total_sessions = serializers.IntegerField()
    present_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    excused_count = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()
    attendance_hits = serializers.IntegerField()