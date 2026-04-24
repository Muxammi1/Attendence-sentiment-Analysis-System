from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Course, Lecture, LectureSession
from datetime import timedelta
from django.utils import timezone
import datetime

@receiver(post_save, sender=Course)
def create_course_lectures_and_sessions(sender, instance, created, **kwargs):
    if created:
        # Generate 16 lectures
        lectures_to_create = []
        for i in range(1, 17):
            lectures_to_create.append(
                Lecture(course=instance, lecture_number=i, title=f"Lecture {i}")
            )
        
        # Bulk create lectures and retrieve them to get their IDs
        Lecture.objects.bulk_create(lectures_to_create)
        lectures = Lecture.objects.filter(course=instance).order_by('lecture_number')

        # Generate 2 sessions per lecture
        sessions_to_create = []
        base_date = timezone.now().date()
        
        for idx, lecture in enumerate(lectures):
            # Just space the dates out slightly for sample data
            lecture_date = base_date + timedelta(days=idx*7)
            
            # Session 1
            sessions_to_create.append(
                LectureSession(
                    lecture=lecture,
                    session_number=1,
                    date=lecture_date,
                    start_time=datetime.time(9, 0),
                    end_time=datetime.time(10, 30),
                    location="TBD"
                )
            )
            # Session 2
            sessions_to_create.append(
                LectureSession(
                    lecture=lecture,
                    session_number=2,
                    date=lecture_date,
                    start_time=datetime.time(11, 0),
                    end_time=datetime.time(12, 30),
                    location="TBD"
                )
            )
        
        LectureSession.objects.bulk_create(sessions_to_create)
