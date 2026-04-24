from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from students.models import Student


class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='courses')
    students = models.ManyToManyField(Student, related_name='courses_enrolled', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"

from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date, timedelta

@receiver(post_save, sender=Course)
def create_course_structure(sender, instance, created, **kwargs):
    if created:
        for i in range(1, 17):
            lecture = Lecture.objects.create(course=instance, lecture_number=i)
            # Create 2 sessions per lecture
            for s in range(1, 3):
                LectureSession.objects.create(
                    lecture=lecture,
                    session_number=s,
                    date=date.today() + timedelta(weeks=(i-1), days=(s*2)), # Simulated schedule
                    start_time="09:00",
                    end_time="12:00",
                    location="Main Campus"
                )


class Lecture(models.Model):
    """Represents a lecture (16 per course)"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lectures')
    lecture_number = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(16)])
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('course', 'lecture_number')
        ordering = ['lecture_number']

    def __str__(self):
        return f"{self.course.code} - Lecture {self.lecture_number}"

class LectureSession(models.Model):
    """Represents a session for a lecture (2 sessions per lecture = 32 total per course)"""
    lecture = models.ForeignKey(Lecture, on_delete=models.CASCADE, related_name='sessions')
    session_number = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(2)])  # 2 sessions per lecture
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('lecture', 'session_number', 'date')
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.lecture.course.code} - Lecture {self.lecture.lecture_number} - Session {self.session_number} ({self.date})"

class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Excused', 'Excused'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    lecture_session = models.ForeignKey(LectureSession, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Absent')
    hit_1 = models.BooleanField(default=False)
    hit_2 = models.BooleanField(default=False)
    hit_3 = models.BooleanField(default=False)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='marked_attendance')
    marked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('student', 'lecture_session')
        ordering = ['-marked_at']

    def __str__(self):
        return f"{self.student.enrollment_id} - {self.lecture_session} - {self.status}"

class AttendanceReview(models.Model):
    """Records faculty double-check of attendance"""
    attendance_record = models.OneToOneField(AttendanceRecord, on_delete=models.CASCADE, related_name='review')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_attendance')
    reviewed_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True)
    comments = models.TextField(blank=True)

    class Meta:
        ordering = ['-reviewed_at']

    def __str__(self):
        return f"Review: {self.attendance_record} - {'Approved' if self.is_approved else 'Flagged'}"

class SentimentRecord(models.Model):
    """Records sentiment analysis results for students during lecture sessions"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='sentiment_records')
    lecture_session = models.ForeignKey(LectureSession, on_delete=models.CASCADE, related_name='sentiment_records')
    dominant_emotion = models.CharField(max_length=50, blank=True)
    confidence_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'lecture_session')
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.student.enrollment_id} - {self.lecture_session} - {self.dominant_emotion}"
