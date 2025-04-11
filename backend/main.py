from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks,HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
from gemini_genre_and_age_analysis import helper_analyze_content
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import logging
from recommendation_system import predict_user_genres

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Age and Gender Detector API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Base directory for temporary storage
BASE_TEMP_DIR = Path("Clean-Feed/temp")

@app.post("/upload/")
async def upload_file(
    background_tasks: BackgroundTasks,
    userId: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        user_dir = BASE_TEMP_DIR / userId
        user_dir.mkdir(parents=True, exist_ok=True)

        file_location = user_dir / file.filename

        # Save uploaded file to disk
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 👇 Background analysis task
        background_tasks.add_task(helper_analyze_content, userId, file_location)

        return JSONResponse(
            status_code=200,
            content={"message": "File uploaded successfully", "file_path": str(file_location)}
        )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# Global variable for model
model = None
MODEL_PATH = "Age_Gender_Detector.keras"

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

@app.get("/get-recommendations/")
def get_recommendations(userId:int):
    # userId = 1234
    predicted = predict_user_genres(f"temp/{userId}.csv")
    print(f"Top genres predicted for user {userId}:", predicted)
    return predicted

@app.get("/")
def read_root():
    return {"message": "Welcome to Age and Gender Detector API"}

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    """
    Endpoint to predict age and gender from an uploaded image
    """
    try:
        # Read the image file
        contents = await file.read()

        # Process image and get predictions
        age, gender = predict_age_gender(contents)

        # Log results to console
        logger.info(f"Prediction: Age = {age}, Gender = {gender}")

        return JSONResponse(content={
            "filename": file.filename,
            "predicted_age": age,
            "predicted_gender": gender
        })

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Load model at startup to avoid delay on first request
@app.on_event("startup")
async def startup_event():
    try:
        load_model_once()
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
