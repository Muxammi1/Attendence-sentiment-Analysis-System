from django.contrib import admin
from .models import Course, Lecture, LectureSession, AttendanceRecord, AttendanceReview

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'instructor')
    search_fields = ('code', 'name')
    filter_horizontal = ('students',)

@admin.register(Lecture)
class LectureAdmin(admin.ModelAdmin):
    list_display = ('course', 'lecture_number', 'title')
    search_fields = ('course__code', 'title')
    list_filter = ('course',)

@admin.register(LectureSession)
class LectureSessionAdmin(admin.ModelAdmin):
    list_display = ('lecture', 'session_number', 'date', 'start_time', 'end_time', 'location')
    search_fields = ('lecture__course__code',)
    list_filter = ('lecture__course', 'date')

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'lecture_session', 'status', 'marked_by', 'marked_at')
    search_fields = ('student__enrollment_id', 'lecture_session__lecture__course__code')
    list_filter = ('lecture_session', 'status', 'marked_at')
    readonly_fields = ('marked_at', 'updated_at')

@admin.register(AttendanceReview)
class AttendanceReviewAdmin(admin.ModelAdmin):
    list_display = ('attendance_record', 'reviewed_by', 'is_approved', 'reviewed_at')
    search_fields = ('attendance_record__student__enrollment_id',)
    list_filter = ('is_approved', 'reviewed_at')
    readonly_fields = ('reviewed_at',)
