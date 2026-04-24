from django.core.management.base import BaseCommand
from cv_engine.pipeline import VideoIngestionPipeline

class Command(BaseCommand):
    help = 'Boots up a local instance of the Computer Vision processing node.'

    def add_arguments(self, parser):
        parser.add_argument('--camera', type=str, default='cam-01', help='The ID of the CCTV camera stub.')

    def handle(self, *args, **options):
        camera_id = options['camera']
        self.stdout.write(self.style.SUCCESS(f'Initializing CV Node for {camera_id}...'))
        
        pipeline = VideoIngestionPipeline(camera_id=camera_id)
        
        try:
            pipeline.capture_loop()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Pipeline crashed: {e}'))
        
        self.stdout.write(self.style.SUCCESS('CV Node shut down successfully.'))
