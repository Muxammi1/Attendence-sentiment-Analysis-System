try:
    import cv2
except ImportError:
    cv2 = None
import numpy as np
import logging
import os

try:
    import insightface
    from insightface.app import FaceAnalysis
except ImportError:
    insightface = None
    FaceAnalysis = None

logger = logging.getLogger(__name__)

class FaceExtractor:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FaceExtractor, cls).__new__(cls)
        return cls._instance

    def get_model(self):
        if self._model is None and FaceAnalysis:
            try:
                # Initialize ArcFace model
                # We use CPU for stability in standard environments
                model = FaceAnalysis(providers=['CPUExecutionProvider'], name='buffalo_l')
                model.prepare(ctx_id=0, det_size=(640, 640))
                self._model = model
            except Exception as e:
                logger.error(f"Failed to initialize InsightFace model: {e}")
        return self._model

    def extract_embedding(self, image_bytes):
        """
        Extracts a 512-d embedding from image bytes.
        Returns the embedding list and any error message.
        """
        model = self.get_model()
        if not model:
            return None, "Biometric engine is not initialized or missing dependencies."

        # Convert bytes to cv2 image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None, "Invalid image format."

        # Detect faces
        faces = model.get(img)
        
        if not faces:
            return None, "No face detected in the image."
        
        if len(faces) > 1:
            return None, "Multiple faces detected. Please provide an image with a single face."

        # Extract 512-d embedding
        embedding = faces[0].embedding.tolist()
        return embedding, None

# Singleton instance
face_extractor = FaceExtractor()
