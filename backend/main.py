from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks, HTTPException, Depends
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
from gemini_genre_and_age_analysis import helper_analyze_content, analyze_content
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import logging
from recommendation_system import predict_user_genres
from auth import Token, UserCreate, LoginModel, create_user, authenticate_user, create_access_token, get_current_active_user, init_auth, clean_user_data
from datetime import datetime, timezone,timedelta
from cloudinary_utils import upload_to_cloudinary
from reels_schema import ReelModel
from bson import ObjectId
import json

# Import the reels endpoints router
from reels_endpoints import init_reels_router

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Age and Gender Detector API")

# Add CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers to the browser
)

# Base directory for temporary storage
BASE_TEMP_DIR = Path("Clean-Feed/temp")

# Import from auth.py
from auth import users_collection
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client.cleanfeed_db
reels_collection = db.reels

# Initialize and include the reels router
reels_router = init_reels_router(reels_collection)
app.include_router(reels_router)

# Authentication endpoints
@app.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    user_data = await create_user(user)
    if not user_data:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Generate token for auto-login after signup
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Clean user data for response (remove sensitive fields)
    user_response = clean_user_data(user_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@app.post("/auth/login", response_model=Token)
async def login(login_data: LoginModel):
    user = await authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )

    # Clean user data for response (remove sensitive fields)
    user_response = clean_user_data(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@app.get("/auth/me")
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    # Clean user data for response
    user_data = clean_user_data(current_user)
    return user_data

# Debug endpoint to test token validation
@app.get("/auth/validate-token")
async def validate_token(current_user: dict = Depends(get_current_active_user)):
    return {"message": "Token is valid", "user_id": str(current_user["_id"])}

@app.post("/upload/")
async def upload_file(
    background_tasks: BackgroundTasks,
    userId: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)  # Require authentication
):
    try:
        # Log authentication success
        logger.info(f"Authentication successful for user: {current_user['email']}")

        # Create directory if it doesn't exist
        user_dir = BASE_TEMP_DIR / userId
        user_dir.mkdir(parents=True, exist_ok=True)

        file_location = user_dir / file.filename

        # Save uploaded file to disk
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Analyze content immediately (not in background)
        analysis_result = await analyze_content(file_location)

        if "error" in analysis_result:
            return JSONResponse(
                status_code=400,
                content={"error": analysis_result["error"]}
            )

        # Save metadata for future reference
        metadata_file = file_location.with_suffix(file_location.suffix + ".metadata.json")
        with open(metadata_file, "w") as f:
            json.dump(analysis_result, f, indent=4)

        return JSONResponse(
            status_code=200,
            content={
                "message": "File uploaded and analyzed successfully",
                "file_path": str(file_location),
                "analysis": analysis_result
            }
        )

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/finalize-upload/")
async def finalize_upload(
    userId: str = Form(...),
    filePath: str = Form(...),
    caption: str = Form(...),
    current_user: dict = Depends(get_current_active_user)
):
    try:
        # Check if user exists
        user = await users_collection.find_one({"_id": ObjectId(userId)})
        if not user:
            return JSONResponse(
                status_code=404,
                content={"error": "User not found"}
            )

        file_path = Path(filePath)
        if not file_path.exists():
            return JSONResponse(
                status_code=404,
                content={"error": "File not found"}
            )

        # Load analysis results
        metadata_file = file_path.with_suffix(file_path.suffix + ".metadata.json")
        if not metadata_file.exists():
            return JSONResponse(
                status_code=404,
                content={"error": "Analysis data not found"}
            )

        with open(metadata_file, "r") as f:
            analysis_result = json.load(f)

        # Upload to cloudinary
        video_url, error = await upload_to_cloudinary(file_path)
        if error:
            return JSONResponse(
                status_code=500,
                content={"error": f"Cloudinary upload failed: {error}"}
            )

        # Check if video URL already exists in database
        existing_reel = await reels_collection.find_one({"videoUrl": video_url})
        if existing_reel:
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Video already exists in database",
                    "reelId": str(existing_reel["_id"]),
                    "videoUrl": video_url,
                    "exists": True
                }
            )

        # Create reel document
        reel_data = {
            "videoUrl": video_url,
            "caption": caption,
            "age_group": analysis_result.get("age_group", ""),
            "tags": analysis_result.get("tags", []),
            "genres": analysis_result.get("genres", []),
            "userId": userId,
            "created_at": datetime.now(timezone.utc)
        }

        result = await reels_collection.insert_one(reel_data)

        # Return success with reel ID
        return JSONResponse(
            status_code=200,
            content={
                "message": "Video uploaded to Cloudinary and saved to database",
                "reelId": str(result.inserted_id),
                "videoUrl": video_url,
                "exists": False
            }
        )

    except Exception as e:
        logger.error(f"Finalize upload error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/get-recommendations/")
def get_recommendations(userId: int, current_user: dict = Depends(get_current_active_user)):
    # userId = 1234
    predicted = predict_user_genres(f"temp/{userId}.csv")
    print(f"Top genres predicted for user {userId}:", predicted)
    return predicted

@app.get("/")
def read_root():
    return {"message": "Welcome to Age and Gender Detector API"}

@app.post("/predict/")
async def predict(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
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

# Load model at startup to avoid delay on first request
@app.on_event("startup")
async def startup_event():
    try:
        # Initialize the model
        load_model_once()

        # Initialize MongoDB indexes for auth
        await init_auth()

        # Create index on userId for reels collection
        await reels_collection.create_index("userId")

        # Make sure temp directory exists
        BASE_TEMP_DIR.mkdir(parents=True, exist_ok=True)

        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)