from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from auth import get_current_active_user
from bson import ObjectId
import logging
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

# Create router for reels endpoints
router = APIRouter(prefix="/reels", tags=["reels"])

# This function will be initialized with a database reference in main.py
reels_collection = None

def init_reels_router(db_reels_collection):
    """Initialize the router with database collection"""
    global reels_collection
    reels_collection = db_reels_collection
    return router

# Custom JSON encoder function to handle datetime objects
def serialize_document(doc):
    """Convert MongoDB document to JSON-serializable format"""
    # Handle datetime objects
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc

@router.post("/", response_description="Get user reels")
async def get_user_reels(current_user: dict = Depends(get_current_active_user)):
    try:
        # Extract user ID from authenticated user
        user_id = str(current_user["_id"])

        # Query database for reels belonging to the user
        user_reels = []
        cursor = reels_collection.find({"userId": user_id})

        # Convert cursor to list of documents
        async for document in cursor:
            # Serialize the document properly
            serialized_doc = serialize_document(dict(document))
            # Already convert ObjectId to string
            serialized_doc["_id"] = str(document["_id"])
            user_reels.append(serialized_doc)

        if len(user_reels) == 0:
            return JSONResponse(
                status_code=200,
                content={"message": "No reels found for this user", "reels": []}
            )

        return JSONResponse(
            status_code=200,
            content={"reels": user_reels}
        )

    except Exception as e:
        logger.error(f"Error retrieving user reels: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve reels: {str(e)}")