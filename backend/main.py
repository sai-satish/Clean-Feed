from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import logging
from dotenv import load_dotenv
from utils.auth_utils import get_current_active_user, init_auth
from utils.age_prediction import *
from utils.db_utils import *
from routes.reels_endpoints import init_reels_router
from routes.auth import init_auth_router
from routes.upload_handler import init_upload_router
from routes.user_interactions import init_user_interaction_router


# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base directory for temporary storage
BASE_TEMP_DIR = Path("Clean-Feed/temp")
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

# Initialize and include the reels router
reels_router = init_reels_router(reels_collection)
auth_router = init_auth_router()
upload_router = init_upload_router()
user_interaction_router = init_user_interaction_router()

app.include_router(reels_router)
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(user_interaction_router)


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
        await users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"age": age}}
        )

        return JSONResponse(content={
            "filename": file.filename,
            "predicted_age": age,
            "predicted_gender": gender
        })

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Welcome to Age and Gender Detector API"}

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