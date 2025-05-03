from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
import json
from dotenv import load_dotenv
from datetime import datetime, timezone
from bson import ObjectId
from utils.auth_utils import get_current_active_user
from utils.gemini_genre_and_age_analysis import analyze_content
from utils.cloudinary_utils import upload_to_cloudinary
from utils.db_utils import *
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_TEMP_DIR = Path("Clean-Feed/temp")


# Set up logging
load_dotenv()


# Create router instance
router = APIRouter(prefix="/upload",tags=["uploads"])


@router.post("/")
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

@router.post("/finalize")
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
    
def init_upload_router():
    """Initialize the router"""
    return router