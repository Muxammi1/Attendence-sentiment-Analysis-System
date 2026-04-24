import json
import logging
from celery import shared_task
try:
    from kafka import KafkaConsumer
except ImportError:
    KafkaConsumer = None
from django.conf import settings
from academics.models import SentimentRecord, AttendanceRecord
from .pipeline import VideoIngestionPipeline
from django.utils import timezone

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def consume_attendance_events(self):
    """Celery worker fetching Kafka streams iteratively securely backing the Daemon footprint natively."""
    if not KafkaConsumer:
        logger.error("KafkaConsumer not available. Skipping task.")
        return

    try:
        consumer = KafkaConsumer(
            'student-attendance',
            bootstrap_servers=[settings.KAFKA_BROKER_URL],
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            consumer_timeout_ms=10000 
        )
        
        logger.info("Celery Kafka Consumer polling activated...")
        for message in consumer:
            data = message.value
            student_id = data.get('student_id')
            lecture_id = data.get('lecture_session_id')
            
            # Simulated storage processing
            # ... Process mapping records into AttendanceRecord natively.
            
            logger.info(f"Processed metric for student {student_id}")
            
    except Exception as e:
        logger.error(f"Kafka consumer daemon failed: {str(e)}")
        raise self.retry(exc=e, countdown=60)

@shared_task
def start_cv_engine(camera_id):
    """Starts the CV ingestion pipeline for a given camera."""
    print(f"DEBUG: start_cv_engine task started for camera {camera_id}")
    logger.info(f"Starting CV Engine for Camera {camera_id}")
    try:
        pipeline = VideoIngestionPipeline(camera_id)
        pipeline._single_iteration_mode = False # Keep it running
        print("DEBUG: Entering capture_loop...")
        pipeline.capture_loop()
        print("DEBUG: capture_loop exited.")
    except Exception as e:
        print(f"DEBUG: Error in start_cv_engine: {e}")
        logger.error(f"Error in start_cv_engine: {e}")
