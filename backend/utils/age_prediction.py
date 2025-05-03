import cv2
import numpy as np
from tensorflow.keras.models import load_model
from fastapi import HTTPException
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable for model
model = None
MODEL_PATH = "models/Age_Gender_Detector.keras"
# Gender dictionary
GENDER_DICT = {0: 'Male', 1: 'Female'}


def load_model_once():
    """Load the model once and reuse it for all requests"""
    global model
    if model is None:
        try:
            logger.info(f"Loading model from {MODEL_PATH}")
            model = load_model(MODEL_PATH)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise HTTPException(status_code=500, detail="Model could not be loaded")
    return model

def predict_age_gender(image_bytes, age_type='regression', age_bins=None):
    """
    Robust age/gender prediction with fallback face detection
    """
    # Load model and get input specs
    model = load_model_once()
    input_shape = model.input_shape[1:3]
    input_channels = model.input_shape[-1]

    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    # Initialize face detector (try multiple methods)
    face = None
    try:
        # Try Haar Cascade
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda f: f[2]*f[3])
            face = img[y:y+h, x:x+w]
            logger.info("Face detected using Haar Cascade")
    except Exception as e:
        logger.warning(f"Face detection failed: {str(e)}")

    # If no face detected, use entire image
    if face is None:
        logger.info("No face detected, using entire image")
        face = img

    # Preprocessing pipeline
    face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    face = cv2.resize(face, input_shape)

    if input_channels == 1:
        face = cv2.cvtColor(face, cv2.COLOR_RGB2GRAY)
        face = np.expand_dims(face, axis=-1)

    face = face.astype('float32') / 255.0
    face = np.expand_dims(face, axis=0)

    # Prediction handling
    preds = model.predict(face, verbose=0)
    gender_pred = preds[0] if isinstance(preds, list) else preds[:, :len(GENDER_DICT)]
    age_pred = preds[1] if isinstance(preds, list) else preds[:, len(GENDER_DICT):]

    # Gender decoding
    gender_idx = np.argmax(gender_pred)
    predicted_gender = GENDER_DICT.get(gender_idx, 'Unknown')

    # Age decoding
    if age_type == 'classification' and age_bins:
        age_idx = np.argmax(age_pred)
        predicted_age = int(np.mean(age_bins[age_idx]))
    else:  # Regression
        predicted_age = int(np.clip(age_pred[0][0], 0, 100))

    return predicted_age, predicted_gender