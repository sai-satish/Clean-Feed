import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

async def upload_to_cloudinary(file_path: Path, folder="reels"):
    """
    Upload a file to Cloudinary and return the public URL
    """
    try:
        # Upload file to cloudinary
        result = cloudinary.uploader.upload(
            str(file_path),
            folder=folder,
            resource_type="auto"
        )

        # Return the secure URL
        return result.get("secure_url"), None
    except Exception as e:
        return None, str(e)