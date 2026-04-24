# Attendance-Sentiment-Analysis-System: Comprehensive Codebase Analysis

**Generated:** April 22, 2026  
**Project Type:** Django + React Full-Stack Application

---

## Executive Summary

The **Attendance-Sentiment-Analysis-System** is a comprehensive full-stack application designed to track student attendance and analyze emotional/sentiment states during lectures using computer vision and facial emotion recognition. The system uses Django as the backend API, React as the frontend, PostgreSQL for persistent storage, and Redis + Kafka for event streaming and task queuing.

---

## Table of Contents

1. [Backend Architecture](#backend-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Architecture](#frontend-architecture)
5. [Sentiment Analysis Implementation](#sentiment-analysis-implementation)
6. [Technology Stack & Dependencies](#technology-stack--dependencies)
7. [Data Flow](#data-flow)
8. [File Structure Summary](#file-structure-summary)

---

## Backend Architecture

### Overview
- **Framework:** Django 4.2+ with Django REST Framework
- **Architecture Pattern:** Modular app-based structure with clear separation of concerns
- **Authentication:** Custom user model with role-based access (Admin, Faculty)
- **API Format:** RESTful API using DRF

### Backend Apps Structure

#### 1. **`users/` App** - Authentication & Authorization
**Purpose:** Custom user management and role-based access control

**Files:**
- [users/models.py](users/models.py) - Defines `CustomUser` model with role choices
- [users/admin.py](users/admin.py)
- [users/apps.py](users/apps.py)
- [users/tests.py](users/tests.py)
- [users/views.py](users/views.py)
- [users/migrations/](users/migrations/)

**Key Models:**
```python
CustomUser(AbstractUser)
  - role: ADMIN or FACULTY (CharField with choices)
  - Standard Django auth fields (username, email, password, etc.)
```

**Permissions:** Admin-only access for most operations; Faculty users can view their own courses and sessions.

---

#### 2. **`students/` App** - Student & Biometric Data
**Purpose:** Manage student records and biometric enrollment (face embeddings)

**Files:**
- [students/models.py](students/models.py) - Core student and biometric models
- [students/serializers.py](students/serializers.py) - DRF serializers for API responses
- [students/views.py](students/views.py) - ViewSets for CRUD operations
- [students/urls.py](students/urls.py) - URL routing
- [students/admin.py](students/admin.py)
- [students/tests.py](students/tests.py)

**Key Models:**
```python
Student
  - enrollment_id: CharField(unique=True, max_length=50)
  - name: CharField(max_length=255)
  - is_active: BooleanField(default=True)
  
BiometricEmbedding (OneToOne with Student)
  - embedding: ArrayField(FloatField, size=512)  # ArcFace 512-d embedding
  - consent_provided: BooleanField(default=False)
  - updated_at: DateTimeField(auto_now=True)
```

**API Endpoints:**
- `GET /api/students/` - List all students (Admin-only)
- `POST /api/students/` - Create new student (Admin-only)
- `GET /api/students/{id}/` - Retrieve specific student
- `POST /api/students/{id}/enroll_biometrics/` - Upload face embedding with consent

**Key Features:**
- FAISS index synchronization for biometric face matching
- OneToOne relationship ensures one embedding per student
- ArrayField stores 512-dimensional ArcFace embeddings

---

#### 3. **`academics/` App** - Courses & Lecture Sessions
**Purpose:** Manage courses, lecture sessions, and attendance/sentiment records

**Files:**
- [academics/models.py](academics/models.py) - Course, session, and record models
- [academics/admin.py](academics/admin.py)
- [academics/apps.py](academics/apps.py)
- [academics/management/commands/run_attendance_consumer.py](academics/management/commands/run_attendance_consumer.py)

**Key Models:**
```python
Course
  - code: CharField(unique=True, max_length=20)
  - name: CharField(max_length=255)
  - instructor: ForeignKey(CustomUser) - Faculty member teaching course
  
LectureSession
  - course: ForeignKey(Course) → CASCADE
  - session_number: IntegerField (1-16, validated)
  - date: DateField
  - start_time: TimeField
  - end_time: TimeField
  - unique_together: ('course', 'session_number')
  
AttendanceRecord
  - student: ForeignKey(Student) → CASCADE
  - lecture_session: ForeignKey(LectureSession) → CASCADE
  - status: CharField(choices=['Present', 'Absent', 'Excused'])
  - timestamp: DateTimeField(auto_now_add=True)
  - unique_together: ('student', 'lecture_session')
  
SentimentRecord
  - student: ForeignKey(Student) → CASCADE
  - lecture_session: ForeignKey(LectureSession) → CASCADE
  - dominant_emotion: CharField(max_length=50)
  - confidence_score: FloatField (0-1)
  - timestamp: DateTimeField(auto_now_add=True)
```

**Database Relationships:**
```
CustomUser (Instructor)
    ↓
  Course (multiple)
    ↓
  LectureSession (16 max per course)
    ↙         ↘
AttendanceRecord  SentimentRecord
    ↓              ↓
  Student      Student
```

---

#### 4. **`cv_engine/` App** - Computer Vision & Sentiment Analysis
**Purpose:** Handle face detection, tracking, emotion recognition, and biometric embeddings

**Files:**
- [cv_engine/pipeline.py](cv_engine/pipeline.py) - Main video ingestion and processing
- [cv_engine/faiss_service.py](cv_engine/faiss_service.py) - FAISS index management
- [cv_engine/kafka_client.py](cv_engine/kafka_client.py) - Kafka producer/consumer wrappers
- [cv_engine/tasks.py](cv_engine/tasks.py) - Celery async tasks
- [cv_engine/apps.py](cv_engine/apps.py)
- [cv_engine/management/commands/run_cv_node.py](cv_engine/management/commands/run_cv_node.py)

**Key Classes & Functions:**

**VideoIngestionPipeline:**
- Initializes face detection, emotion recognition, and ArcFace embedding models
- Methods:
  - `__init__(camera_id)` - Initialize trackers and models
  - `extract_face_embedding(face_crop)` - Extract 512-d ArcFace embedding
  - `capture_loop()` - Main video processing loop
    - Captures frames from camera
    - Detects faces using Haar cascade
    - Tracks faces using DeepSort
    - Extracts emotion using FER
    - Generates embeddings using InsightFace/ArcFace
    - Publishes detections to Kafka

**FAISSIndexManager:**
- Manages FAISS index for fast face matching
- Methods:
  - `add_embedding(student_id, vector)` - Add 512-d vector to index
  - `search(vector, k=1, distance_threshold=1.0)` - Find matching student
  - `rebuild_index(embeddings_dict)` - Rebuild from student embeddings

**KafkaProducerWrapper/KafkaConsumerWrapper:**
- Graceful degradation for Kafka availability
- Topics: `student-attendance` (event stream)
- Message format: JSON with student_id, emotion, embedding, timestamp

---

#### 5. **`dashboard/` App** - Faculty Dashboard API
**Purpose:** Provide course overview and attendance/sentiment views for faculty

**Files:**
- [dashboard/views.py](dashboard/views.py) - API views
- [dashboard/urls.py](dashboard/urls.py) - URL routing
- [dashboard/views.py](dashboard/views.py)

**API Endpoints:**
```
GET /api/dashboard/courses/
  - Returns: [{"id": 1, "code": "CS101", "name": "Introduction to CS", ...}]
  - Auth: IsAuthenticated (Faculty sees own courses)

GET /api/dashboard/courses/<course_id>/
  - Returns: {
      "course": {...},
      "sessions": [{
        "session_number": 1,
        "date": "2026-04-21",
        "attendance": [{"student": "STU001", "status": "Present", "id": 1}],
        "sentiment": [{"student": "STU001", "emotion": "Engaged", "score": 0.85}]
      }]
    }
  - Auth: IsAuthenticated (Can only view own courses)

PATCH /api/dashboard/attendance/<record_id>/override/
  - Update attendance status (Present/Absent/Excused)
  - Auth: IsAuthenticated (Can only update own course records)
```

**Key Views:**
- `CourseDashboardAPI` - Get all courses for logged-in instructor
- `CourseDetailAPI` - Get course with all sessions and attendance/sentiment data
- `AttendanceOverrideAPI` - Manual attendance status correction

---

#### 6. **`audit/` App** - Audit Logging & Middleware
**Purpose:** Immutable audit trail of all user actions

**Files:**
- [audit/models.py](audit/models.py) - AuditLog model
- [audit/middleware.py](audit/middleware.py) - Audit logging middleware
- [audit/admin.py](audit/admin.py)
- [audit/apps.py](audit/apps.py)
- [audit/views.py](audit/views.py)

**Key Models:**
```python
AuditLog (Immutable)
  - user: ForeignKey(CustomUser) - Nullable
  - action: CharField(max_length=255)
  - ip_address: GenericIPAddressField
  - timestamp: DateTimeField(auto_now_add=True)
  - Methods: save() and delete() are overridden to prevent modification
```

**Middleware Integration:**
- Automatically logs all HTTP requests
- Records user, action, IP, timestamp
- Prevents modification/deletion of logs (immutable)

---

### Core Configuration

**File:** [core/settings.py](core/settings.py)

**Database:**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        # Host/port from environment variables
    }
}
```

**Installed Apps:**
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
    'audit',
    'students',
    'cv_engine',
    'academics',
    'dashboard',
]
```

**Middleware:**
```python
- CorsMiddleware (CORS_ALLOW_ALL_ORIGINS = True)
- SecurityMiddleware
- SessionMiddleware
- AuthenticationMiddleware
- AuditLogMiddleware (custom)
```

**Cache & Async:**
```python
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
CACHE_BACKEND = RedisCache (LOCATION: REDIS_URL)
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')
```

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐
│   CustomUser    │
│   (AUTH USER)   │
├─────────────────┤
│ id (PK)         │
│ username        │
│ email           │
│ password        │
│ role (ADMIN/    │
│  FACULTY)       │
└────────┬────────┘
         │
         │ 1:N (instructor)
         │
         ▼
┌─────────────────────┐
│      Course         │
├─────────────────────┤
│ id (PK)             │
│ code (UNIQUE)       │
│ name                │
│ instructor_id (FK)  │
└────────┬────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────┐
│   LectureSession         │
├──────────────────────────┤
│ id (PK)                  │
│ course_id (FK)           │
│ session_number (1-16)    │
│ date                     │
│ start_time               │
│ end_time                 │
│ UNIQUE(course, session)  │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │ 1:N each│
      ▼         ▼
┌──────────────┐  ┌────────────────┐
│ Attendance   │  │  SentimentRecord│
│  Record      │  │                │
├──────────────┤  ├────────────────┤
│ id (PK)      │  │ id (PK)        │
│ student_id   │  │ student_id (FK)│
│ session_id   │  │ session_id (FK)│
│ status (P/A) │  │ emotion        │
│ timestamp    │  │ confidence     │
│ UNIQUE(S,SL) │  │ timestamp      │
└──────┬───────┘  └────┬───────────┘
       │               │
       └───────┬───────┘
               │
               ▼
         ┌──────────────┐
         │   Student    │
         ├──────────────┤
         │ id (PK)      │
         │ enrollment_id│
         │ name         │
         │ is_active    │
         └────┬─────────┘
              │
              │ 1:1 (unique)
              │
              ▼
         ┌─────────────────┐
         │ BiometricEmbdg  │
         ├─────────────────┤
         │ id (PK)         │
         │ student_id (FK) │
         │ embedding[512]  │ ← ArcFace
         │ consent_provided│
         │ updated_at      │
         └─────────────────┘

┌─────────────────┐
│   AuditLog      │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │ Nullable
│ action (text)   │
│ ip_address      │
│ timestamp       │
│ (Immutable)     │
└─────────────────┘
```

### Key Relationships

| Model A | Model B | Type | Notes |
|---------|---------|------|-------|
| CustomUser | Course | 1:N | One instructor many courses |
| Course | LectureSession | 1:N | Each course has 1-16 sessions |
| LectureSession | AttendanceRecord | 1:N | Each session has many attendance records |
| LectureSession | SentimentRecord | 1:N | Each session has many sentiment records |
| Student | AttendanceRecord | 1:N | Each student has many attendance records |
| Student | SentimentRecord | 1:N | Each student has many sentiment records |
| Student | BiometricEmbedding | 1:1 | Each student has one biometric record |
| CustomUser | AuditLog | 1:N | Each user action is logged (nullable) |

### Constraints

| Table | Constraint | Details |
|-------|-----------|---------|
| Course | UNIQUE | code (course code) |
| LectureSession | UNIQUE | (course_id, session_number) |
| AttendanceRecord | UNIQUE | (student_id, lecture_session_id) |
| Student | UNIQUE | enrollment_id |
| AuditLog | IMMUTABLE | Cannot be updated/deleted after creation |

---

## API Endpoints

### Base URL: `http://localhost:8000/api/`

#### Students API

**Authentication:** IsAdminUser (except enrollment endpoint which checks consent)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/students/` | List all students | Admin | 200 |
| POST | `/students/` | Create new student | Admin | 201 |
| GET | `/students/{id}/` | Get student details | Admin | 200 |
| PUT | `/students/{id}/` | Update student | Admin | 200 |
| DELETE | `/students/{id}/` | Delete student | Admin | 204 |
| POST | `/students/{id}/enroll_biometrics/` | Upload face embedding | Admin | 200 |

**Request/Response Examples:**

```bash
# POST /api/students/enroll_biometrics/
Request Body:
{
  "embedding": [0.1, 0.2, 0.3, ..., 0.512]  # 512-element array
}

Response (200):
{
  "status": "biometrics enrolled",
  "consent_provided": true
}
```

#### Dashboard API

**Authentication:** IsAuthenticated

| Method | Endpoint | Description | Auth | Returns |
|--------|----------|-------------|------|---------|
| GET | `/dashboard/courses/` | Get instructor's courses | Auth | [{course_obj}] |
| GET | `/dashboard/courses/{course_id}/` | Get course details with sessions | Auth | {course, sessions} |
| PATCH | `/dashboard/attendance/{record_id}/override/` | Update attendance status | Auth | {status, new_status} |

**Request/Response Examples:**

```bash
# GET /api/dashboard/courses/
Response (200):
[
  {
    "id": 1,
    "code": "CS101",
    "name": "Introduction to Computer Science"
  }
]

# GET /api/dashboard/courses/1/
Response (200):
{
  "course": {
    "id": 1,
    "code": "CS101",
    "name": "Introduction to Computer Science"
  },
  "sessions": [
    {
      "session_number": 1,
      "date": "2026-04-21",
      "attendance": [
        {"student": "STU001", "status": "Present", "id": 1},
        {"student": "STU002", "status": "Absent", "id": 2}
      ],
      "sentiment": [
        {"student": "STU001", "emotion": "Engaged", "score": 0.92},
        {"student": "STU002", "emotion": "Neutral", "score": 0.65}
      ]
    }
  ]
}

# PATCH /api/dashboard/attendance/1/override/
Request Body:
{
  "status": "Excused"
}

Response (200):
{
  "status": "success",
  "new_status": "Excused"
}
```

---

## Frontend Architecture

### Technology Stack
- **Framework:** React 19.2+ with React Router DOM 7.14+
- **Styling:** Tailwind CSS 4.2+ with custom theme
- **Build Tool:** Vite 8.0+
- **State Management:** React hooks (no Redux/Zustand currently)

### Frontend Structure

**Files:**
- [frontend/src/App.jsx](frontend/src/App.jsx) - Main app component with routing
- [frontend/src/main.jsx](frontend/src/main.jsx) - React entry point
- [frontend/src/App.css](frontend/src/App.css) - Vite default styles
- [frontend/src/index.css](frontend/src/index.css) - Global styles
- [frontend/tailwind.config.js](frontend/tailwind.config.js) - Tailwind config
- [frontend/vite.config.js](frontend/vite.config.js) - Vite config

### Current Components

#### 1. **TopNavbar** (`frontend/src/components/TopNavbar.jsx`)
- Fixed navigation bar at top
- Displays university logo and "Faculty Dashboard" title
- Shows current user name ("Dr. Example")
- Styling: Fixed position, z-50, primary color background

#### 2. **Sidebar** (`frontend/src/components/Sidebar.jsx`)
- Fixed left sidebar (width: 64 units / 256px)
- Navigation menu items:
  - Dashboard
  - My Courses
  - Attendance Reports
  - Sentiment Insights
- Responsive: Hidden on mobile, visible on md+ breakpoints
- Styling: Light background with hover effects

#### 3. **AttendanceCard** (`frontend/src/components/AttendanceCard.jsx`)
- Reusable card component displaying course session info
- Props: `courseCode`, `lectureNo`, `date`, `children`
- Shows:
  - Course code and lecture number
  - Date
  - Attendance rate percentage
  - Dominant sentiment with color-coded badge
  - "View Detail" button
- Styling: Card with border, shadow, and flex layout

#### 4. **DashboardHome** (in `frontend/src/App.jsx`)
- Main dashboard page
- Displays welcome header
- Grid layout with 2 AttendanceCard examples:
  - AASAS-101: 85% attendance, "Engaged" sentiment
  - NET-202: 92% attendance, "Neutral" sentiment

### UI Theme & Styling

**Tailwind Configuration** ([frontend/tailwind.config.js](frontend/tailwind.config.js)):

```javascript
colors: {
  primary: '#0A1F44',        // Dark blue (header background)
  accent: '#3B82F6',         // Bright blue (buttons, highlights)
  textMain: '#111827',       // Dark gray (main text)
  textSec: '#6B7280',        // Medium gray (secondary text)
  bgMain: '#FFFFFF',         // White (card/component background)
  bgSec: '#F5F6F8',          // Light gray (page background)
  borderLight: '#E5E7EB',    // Light border color
}

fontFamily: {
  sans: ['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
}

boxShadow: {
  moodle: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
}
```

**Color Usage:**
- **Primary (#0A1F44):** Header, navigation
- **Accent (#3B82F6):** Buttons, interactive elements, links
- **Text Main:** Body text, card titles
- **Text Secondary:** Subtext, dates, labels
- **Background Main:** Cards, containers
- **Background Secondary:** Page background
- **Border Light:** Card borders, dividers

### Current Routes

```javascript
/              → DashboardHome
/dashboard    → DashboardHome
```

### Missing/Planned Components
Based on sidebar navigation, these pages are not yet implemented:
- My Courses (course list/detail)
- Attendance Reports (detailed attendance view)
- Sentiment Insights (sentiment analytics/charts)

---

## Sentiment Analysis Implementation

### Overview
The system uses multiple ML/DL techniques for comprehensive sentiment/emotion analysis:

1. **Facial Emotion Recognition (FER)** - Primary emotion detection
2. **Face Embedding (InsightFace/ArcFace)** - Biometric identification
3. **Face Tracking (DeepSort)** - Track individuals across frames
4. **Face Detection (Haar Cascade + OpenCV)** - Detect faces in video

### Key Components

#### 1. Video Ingestion Pipeline (`cv_engine/pipeline.py`)

**VideoIngestionPipeline Class:**

```python
class VideoIngestionPipeline:
    def __init__(self, camera_id):
        # Initialize trackers and models
        self.tracker = DeepSort()               # Track individuals
        self.face_cascade = HaarCascade()       # Detect faces
        self.sentiment_model = FER(mtcnn=False) # Emotion recognition
        self.arcface_model = FaceAnalysis()     # Face embedding
    
    def capture_loop(self):
        """Main video processing loop"""
        - Captures frames from camera
        - Detects faces using Haar Cascade
        - Tracks faces with DeepSort (track_id per person)
        - For each tracked person:
          - Extracts emotion using FER
          - Generates 512-d embedding using ArcFace
          - Publishes to Kafka
    
    def extract_face_embedding(self, face_crop):
        """Extract ArcFace 512-dimensional embedding"""
        - Takes cropped face image
        - Returns [512] float array
```

**Emotion Detection:**
- Uses FER library with pre-trained model
- Detects 7 emotions: Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise
- Returns: (dominant_emotion, confidence_score)

**Face Embedding:**
- Uses InsightFace ArcFace model
- Pre-trained on large-scale face dataset
- Generates 512-dimensional vector per face
- Used for student identification and matching

**Face Tracking:**
- DeepSort tracker maintains track_id across frames
- Parameters: max_age=30, n_init=3, nms_max_overlap=1.0
- Associates detections across frames for individual tracking

#### 2. FAISS Service (`cv_engine/faiss_service.py`)

**FAISSIndexManager Class:**

```python
class FAISSIndexManager:
    def __init__(self, dimension=512):
        self.index = faiss.IndexFlatL2(512)  # L2 distance metric
        self.student_ids = []
    
    def add_embedding(self, student_id, vector):
        """Add student's face embedding to index"""
        - Accepts 512-d vector
        - Stores in FAISS index
        - Maps index position to student_id
    
    def search(self, vector, k=1, distance_threshold=1.0):
        """Find matching student from face embedding"""
        - Searches FAISS index for k nearest neighbors
        - Returns student_id if distance < threshold
        - Used for attendance verification
```

**Purpose:**
- Fast nearest-neighbor search for student identification
- L2 (Euclidean) distance metric
- Threshold-based matching (distance < 1.0)

#### 3. Event Streaming (`cv_engine/kafka_client.py`)

**Kafka Topics:**
- **Topic:** `student-attendance`
- **Message Format:**
```json
{
  "camera_id": "1",
  "timestamp": 1713696000.0,
  "detections": [
    {
      "track_id": 1,
      "embedding": [0.1, 0.2, ..., 0.5],  // 512-d
      "sentiment": {
        "emotion": "Engaged",
        "score": 0.92
      }
    },
    // ... more detections
  ]
}
```

**Purpose:**
- Real-time event streaming to backend
- Asynchronous processing via Celery consumers
- Decouples video processing from database writes

#### 4. Celery Tasks (`cv_engine/tasks.py`)

**consume_attendance_events Task:**

```python
@shared_task(bind=True, max_retries=3)
def consume_attendance_events(self):
    """Celery worker consuming Kafka events"""
    - Subscribes to 'student-attendance' topic
    - For each message:
      - Extracts student_id, lecture_session_id
      - Creates AttendanceRecord
      - Creates SentimentRecord with emotion + confidence
    - Retries on failure (max 3 retries, 60s backoff)
```

**Purpose:**
- Background processing of attendance events
- Creates database records from video analysis
- Fault-tolerant with retry logic

### Data Flow: Video to Database

```
1. CAPTURE
   └─ Camera Feed (video stream)

2. DETECT & TRACK
   └─ Haar Cascade detects faces
   └─ DeepSort assigns track_id to each person

3. ANALYZE
   ├─ FER extracts emotion + confidence
   └─ ArcFace generates 512-d embedding

4. MATCH
   └─ FAISS index searches embedding
   └─ Returns likely student_id (if match < threshold)

5. PUBLISH
   └─ KafkaProducer sends detections to 'student-attendance' topic

6. CONSUME (Async)
   └─ Celery worker reads from Kafka
   └─ Creates AttendanceRecord + SentimentRecord in DB

7. QUERY
   └─ Dashboard API fetches records per session
   └─ Frontend displays sentiment badges + attendance rates
```

### ML Models Used

| Model | Source | Purpose | Output |
|-------|--------|---------|--------|
| Haar Cascade | OpenCV built-in | Face detection | Bounding boxes |
| DeepSort | deep-sort-realtime | Face tracking | track_id per person |
| FER | FER library | Emotion detection | Emotion label + score |
| ArcFace | InsightFace | Face embedding | 512-d vector |

### Current Limitations

1. **Face Detection:** Haar Cascade only; modern models (YOLO, RetinaFace) not used
2. **Enrollment:** Manual biometric enrollment; no auto-enrollment flow
3. **Real-time:** Processing is asynchronous; not real-time dashboard updates
4. **Emotions:** Limited to 7 basic emotions; no nuanced sentiment analysis
5. **Consent:** Boolean consent_provided field; no GDPR-level consent handling

---

## Technology Stack & Dependencies

### Backend Dependencies

**Core Framework:**
- `Django>=4.2,<5.0` - Web framework
- `djangorestframework>=3.14.0` - REST API toolkit
- `psycopg2-binary>=2.9.9` - PostgreSQL adapter
- `django-cors-headers>=4.3.0` - CORS headers support

**Database & Caching:**
- `redis>=5.0.1` - Cache backend + Celery broker
- PostgreSQL (external service)

**Message Queue & Async:**
- `kafka-python>=2.0.2` - Kafka producer/consumer
- `celery>=5.3.4` - Task queue for async jobs

**Computer Vision & ML:**
- `opencv-python>=4.8.0` - Image processing, face detection
- `numpy>=1.26.0` - Numerical computing
- `tensorflow-cpu>=2.14.0` - ML framework
- `fer>=22.5.1` - Facial Emotion Recognition
- `faiss-cpu>=1.7.4` - Vector similarity search
- `deep-sort-realtime>=1.3.2` - Multi-object tracking
- `insightface>=0.7.3` - Face analysis (ArcFace embeddings)
- `onnxruntime>=1.15.1` - ML inference runtime

### Frontend Dependencies

**Core:**
- `react@^19.2.5` - UI library
- `react-dom@^19.2.5` - React DOM rendering
- `react-router-dom@^7.14.1` - Client-side routing

**Build & Dev:**
- `vite@^8.0.9` - Lightning-fast build tool
- `@vitejs/plugin-react@^6.0.1` - React plugin for Vite
- `tailwindcss@^4.2.3` - Utility-first CSS framework
- `@tailwindcss/postcss@^4.2.3` - Tailwind PostCSS plugin
- `@tailwindcss/vite@^4.2.3` - Tailwind Vite plugin
- `autoprefixer@^10.5.0` - PostCSS plugin for vendor prefixes
- `postcss@^8.5.10` - CSS transformations

**Linting:**
- `eslint@^9.39.4` - JavaScript linter
- `@eslint/js@^9.39.4` - ESLint config
- `eslint-plugin-react-hooks@^7.1.1` - React hooks linting
- `eslint-plugin-react-refresh@^0.5.2` - React Refresh linting

### Development Environment

**File:** [frontend/package.json](frontend/package.json)

```json
{
  "name": "frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**File:** [backend/requirements.txt](backend/requirements.txt)

---

## Data Flow

### Attendance Recording Flow

```
┌────────────────────────────────────────────────────────────┐
│ 1. VIDEO CAPTURE & PROCESSING (CV Node)                   │
├────────────────────────────────────────────────────────────┤
│ - Capture video from camera                                │
│ - Detect faces (Haar Cascade)                              │
│ - Track individuals (DeepSort: track_id)                   │
│ - Extract emotions (FER)                                    │
│ - Generate embeddings (ArcFace: 512-d)                     │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ 2. KAFKA EVENT PUBLISHING                                  │
├────────────────────────────────────────────────────────────┤
│ Topic: student-attendance                                  │
│ Message: {camera_id, timestamp, detections:[...]}          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ 3. ASYNC EVENT CONSUMPTION (Celery Worker)                 │
├────────────────────────────────────────────────────────────┤
│ - Read Kafka message                                       │
│ - Match student (FAISS search)                             │
│ - Fetch LectureSession from DB                             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ 4. DATABASE WRITE (Django ORM)                             │
├────────────────────────────────────────────────────────────┤
│ AttendanceRecord:                                          │
│   - student_id                                             │
│   - lecture_session_id                                     │
│   - status: 'Present'                                      │
│   - timestamp                                              │
│                                                            │
│ SentimentRecord:                                           │
│   - student_id                                             │
│   - lecture_session_id                                     │
│   - dominant_emotion (e.g., 'Engaged')                     │
│   - confidence_score (0-1)                                 │
│   - timestamp                                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ 5. FRONTEND RETRIEVAL & DISPLAY                            │
├────────────────────────────────────────────────────────────┤
│ - Instructor requests dashboard                            │
│ - API: GET /dashboard/courses/<id>/                        │
│ - Frontend fetches AttendanceRecord + SentimentRecord      │
│ - Renders AttendanceCard with emotion badge               │
└────────────────────────────────────────────────────────────┘
```

### Biometric Enrollment Flow

```
┌────────────────────────────────────────────────────────────┐
│ 1. CAPTURE & EXTRACT (Initial Enrollment)                 │
├────────────────────────────────────────────────────────────┤
│ - Capture student's face photo                             │
│ - Generate ArcFace embedding (512-d)                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ 2. API REQUEST                                             │
├────────────────────────────────────────────────────────────┤
│ POST /api/students/<id>/enroll_biometrics/                 │
│ Body: {"embedding": [0.1, 0.2, ..., 0.5]}                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ 3. DATABASE SAVE (Django ORM)                              │
├────────────────────────────────────────────────────────────┤
│ BiometricEmbedding:                                        │
│   - student_id                                             │
│   - embedding: [512-d vector]                              │
│   - consent_provided: True                                 │
│   - updated_at: now()                                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ 4. FAISS INDEX SYNC                                        │
├────────────────────────────────────────────────────────────┤
│ - Add embedding to FAISS index                             │
│ - Map embedding position to student_id                     │
│ - Ready for face matching during video processing          │
└────────────────────────────────────────────────────────────┘
```

---

## File Structure Summary

### Backend File Hierarchy

```
backend/
├── requirements.txt                 # Python dependencies
├── requirements-web.txt
├── manage.py                        # Django management CLI
├── db.sqlite3                       # SQLite DB (dev only)
│
├── core/                            # Django project config
│   ├── settings.py                  # Main settings (DB, apps, middleware)
│   ├── settings_local.py            # Local overrides
│   ├── urls.py                      # Root URL config
│   ├── asgi.py                      # ASGI entry point
│   ├── wsgi.py                      # WSGI entry point
│   └── celery.py                    # Celery config
│
├── users/                           # User & Auth app
│   ├── models.py                    # CustomUser model
│   ├── serializers.py               # (None yet)
│   ├── views.py                     # (Empty)
│   ├── admin.py
│   ├── apps.py
│   ├── tests.py
│   └── migrations/
│       └── 0001_initial.py
│
├── students/                        # Student & Biometric app
│   ├── models.py                    # Student, BiometricEmbedding
│   ├── serializers.py               # StudentSerializer, BiometricSerializer
│   ├── views.py                     # StudentViewSet
│   ├── urls.py                      # DefaultRouter
│   ├── admin.py
│   ├── apps.py
│   ├── tests.py
│   └── migrations/
│       └── 0001_initial.py
│
├── academics/                       # Courses & Attendance app
│   ├── models.py                    # Course, LectureSession, AttendanceRecord, SentimentRecord
│   ├── admin.py
│   ├── apps.py
│   ├── management/
│   │   └── commands/
│   │       └── run_attendance_consumer.py
│   └── migrations/
│       └── 0001_initial.py
│
├── cv_engine/                       # Computer Vision app
│   ├── pipeline.py                  # VideoIngestionPipeline
│   ├── faiss_service.py             # FAISSIndexManager
│   ├── kafka_client.py              # KafkaProducerWrapper, KafkaConsumerWrapper
│   ├── tasks.py                     # Celery tasks (consume_attendance_events)
│   ├── apps.py
│   ├── management/
│   │   └── commands/
│   │       └── run_cv_node.py
│   └── (No models.py - utility app)
│
├── dashboard/                       # Dashboard API app
│   ├── views.py                     # CourseDashboardAPI, CourseDetailAPI, AttendanceOverrideAPI
│   ├── urls.py                      # URL routing
│   ├── apps.py
│   └── (No models.py - views only)
│
└── audit/                           # Audit Logging app
    ├── models.py                    # AuditLog (immutable)
    ├── middleware.py                # AuditLogMiddleware
    ├── views.py
    ├── admin.py
    ├── apps.py
    ├── tests.py
    └── migrations/
        └── 0001_initial.py
```

### Frontend File Hierarchy

```
frontend/
├── package.json                     # Dependencies & scripts
├── vite.config.js                   # Vite build config
├── tailwind.config.js               # Tailwind theme & config
├── eslint.config.js
├── index.html                       # HTML entry point
│
├── src/
│   ├── main.jsx                     # React entry point
│   ├── App.jsx                      # Main app component + routing
│   ├── App.css                      # Component styles
│   ├── index.css                    # Global styles
│   │
│   ├── components/
│   │   ├── TopNavbar.jsx            # Fixed header navigation
│   │   ├── Sidebar.jsx              # Fixed left sidebar
│   │   └── AttendanceCard.jsx       # Reusable card component
│   │
│   └── assets/                      # Images, fonts, etc.
│
├── public/
│   └── LOGO-IU.png                  # University logo
│
└── build_log.txt
```

### Root Project Structure

```
Attendence-sentiment-Analysis-System/
├── README.md
├── PROJECT_RULES.md                 # Project conventions & standards
├── GSD-STYLE.md                     # GSD methodology documentation
├── model_capabilities.yaml          # Model capabilities config
│
├── backend/                         # Django application
├── frontend/                        # React application
│
├── scripts/                         # Automation scripts
│   ├── start-all.ps1               # Start all services
│   ├── start-backend.ps1           # Start Django
│   ├── start-frontend.ps1          # Start Vite dev server
│   ├── start-celery.ps1            # Start Celery worker
│   ├── setup-backend.ps1           # Setup backend environment
│   ├── validate-*.ps1              # Validation scripts
│   └── search_repo.*               # Search utilities
│
├── docs/                            # Documentation
│   ├── model-selection-playbook.md
│   ├── runbook.md
│   └── token-optimization-guide.md
│
├── gsd-template/                    # GSD templates
├── adapters/                        # Model adapters
│   ├── CLAUDE.md
│   ├── GEMINI.md
│   └── GPT_OSS.md
│
└── .agents/                         # Agent skills & workflows
    └── skills/
        ├── codebase-mapper/
        ├── context-compressor/
        ├── context-fetch/
        ├── debugger/
        ├── empirical-validation/
        ├── executor/
        ├── plan-checker/
        ├── planner/
        ├── token-budget/
        └── verifier/
```

---

## Summary Table: Key Findings

| Category | Component | Key Details |
|----------|-----------|------------|
| **Models** | Student | enrollment_id (unique), name, is_active |
| | BiometricEmbedding | 512-d ArcFace embedding, consent flag, 1:1 with Student |
| | Course | code (unique), instructor ForeignKey |
| | LectureSession | session_number (1-16), date, time, unique per course |
| | AttendanceRecord | status (Present/Absent/Excused), unique per student-session |
| | SentimentRecord | emotion label, confidence score |
| **APIs** | Dashboard | GET /dashboard/courses/, GET /dashboard/courses/{id}/, PATCH /dashboard/attendance/{id}/override/ |
| | Students | GET/POST /students/, POST /students/{id}/enroll_biometrics/ |
| **Frontend** | Components | TopNavbar, Sidebar, AttendanceCard, DashboardHome |
| | Styling | Tailwind CSS with custom theme (primary: #0A1F44, accent: #3B82F6) |
| | Routing | React Router DOM (/, /dashboard) |
| **CV Pipeline** | Face Detection | Haar Cascade (OpenCV) |
| | Face Tracking | DeepSort (track_id per person) |
| | Emotion | FER (7 basic emotions + confidence) |
| | Embedding | ArcFace/InsightFace (512-d vector) |
| | Matching | FAISS index (L2 distance, threshold-based) |
| **Infrastructure** | Database | PostgreSQL |
| | Cache/Queue | Redis |
| | Events | Kafka (student-attendance topic) |
| | Async Tasks | Celery (consume_attendance_events) |
| | Audit | Immutable AuditLog with middleware |

---

## Next Steps & Recommendations

1. **Complete Frontend:** Implement remaining pages (My Courses, Attendance Reports, Sentiment Insights)
2. **Sentiment Analytics:** Add charts/dashboards for emotion trends over time
3. **Real-time Updates:** Consider WebSockets for live dashboard updates
4. **Facial Detection:** Replace Haar Cascade with YOLO or RetinaFace for better accuracy
5. **API Documentation:** Auto-generate Swagger/OpenAPI docs
6. **Testing:** Add comprehensive unit and integration tests
7. **Performance:** Optimize FAISS search and Celery task throughput
8. **Privacy:** Implement GDPR compliance (data retention, consent management)

