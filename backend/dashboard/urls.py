from django.urls import path
from .views import CourseDashboardAPI, CourseDetailAPI, AttendanceOverrideAPI, AdminDashboardAPI, FacultyOverviewAPI, StartSessionAPI
from .live_api import ActiveSessionLiveAPI

urlpatterns = [
    path('courses/', CourseDashboardAPI.as_view(), name='dashboard-courses'),
    path('courses/<int:course_id>/', CourseDetailAPI.as_view(), name='dashboard-course-detail'),
    path('attendance/<int:record_id>/override/', AttendanceOverrideAPI.as_view(), name='dashboard-override'),
    path('admin-stats/', AdminDashboardAPI.as_view(), name='admin-stats'),
    path('faculty-stats/', FacultyOverviewAPI.as_view(), name='faculty-stats'),
    path('sessions/<int:session_id>/live/', ActiveSessionLiveAPI.as_view(), name='session-live-stats'),
    path('sessions/<int:session_id>/start/', StartSessionAPI.as_view(), name='session-start'),
]
