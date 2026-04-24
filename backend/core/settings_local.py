"""
Local development settings — NO Docker, NO PostgreSQL, NO Redis required.
Uses SQLite and Django's in-memory cache for zero-dependency local dev.

Usage:
    set DJANGO_SETTINGS_MODULE=core.settings_local
    python manage.py runserver
"""

from .settings import *  # noqa: F401, F403

DEBUG = True

# ── SQLite — no PostgreSQL install needed ──────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ── In-memory cache — no Redis install needed ──────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ── Celery — run tasks eagerly (inline, no worker process needed) ──────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache+memory://'

# ── Security — relaxed for local dev ──────────────────────────────────────
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
CORS_ALLOW_ALL_ORIGINS = True

# ── REST Framework Configuration ──────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
