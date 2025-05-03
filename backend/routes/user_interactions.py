#user Interactions

from bson import ObjectId
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from utils.db_utils import *
from utils.recommendation_system import get_recommendations

router = APIRouter(prefix="/user_interactions",tags=["uploads"])

@router.get("/generate_user_entry")
async def generate_user_entry(userId: str = "67fd69e1aab3bb979c9a529c", fileName: str = "67fe6cfa5a0f736c67f5d559"):
    try:
        # Fetch video metadata using fileName as _id from reels_collection
        metadata_doc = await reels_collection.find_one({"_id": ObjectId(fileName)})
        if not metadata_doc:
            return JSONResponse(status_code=404, content={"error": "Metadata not found in DB."})

        genres = metadata_doc.get("genres", [])
        tags = metadata_doc.get("tags", [])
        video_url = metadata_doc.get("videoUrl", "")

        # Correct duplicate check
        existing = await user_interactions_collection.find_one({
            "userId": userId,
            "videoUrl": video_url  # corrected here
        })

        if existing:
            return {"message": "Duplicate entry. No video added."}

        new_entry = {
            "userId": userId,
            "tags": tags,
            "genres": genres,
            "liked": False,
            "watch_duration": 0,
            "videoUrl": video_url,
        }

        await user_interactions_collection.insert_one(new_entry)
        return {"message": "Video entry added for user."}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
        
@router.post("/toggle_like")
async def toggle_like(userId: str = "67fd69e1aab3bb979c9a529c", fileName: str = "67fe6cfa5a0f736c67f5d559"):
    try:
        # 1. Fetch the corresponding metadata from the `reels_collection` using the fileName
        metadata_doc = await reels_collection.find_one({"_id": ObjectId(fileName)})
        if not metadata_doc:
            return JSONResponse(status_code=404, content={"error": "Metadata not found in DB."})

        video_url = metadata_doc.get("videoUrl", "")
        if not video_url:
            return JSONResponse(status_code=400, content={"error": "Video URL missing in metadata."})

        # 2. Find the interaction record in user_interactions_collection using userId + videoUrl
        interaction_doc = await user_interactions_collection.find_one({
            "userId": userId,
            "videoUrl": video_url
        })

        if not interaction_doc:
            return JSONResponse(status_code=404, content={"error": "User interaction entry not found."})

        # 3. Toggle 'liked' status
        current_liked = interaction_doc.get("liked", False)
        new_liked = not current_liked

        # 4. Update in DB
        await user_interactions_collection.update_one(
            {"userId": userId, "videoUrl": video_url},
            {"$set": {"liked": new_liked}}
        )

        return {"message": f"'liked' status toggled to {new_liked}"}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/fetch-next-url")
async def fetch_next_url(userId: str = "67fd69e1aab3bb979c9a529c", count: int = 1):
    try:
        # 1. Get genre recommendations
        user_doc = await users_collection.find_one({"_id": ObjectId(userId)})
        # if not user_doc or "age" not in user_doc:
        #     return JSONResponse(status_code=404, content={"message": "User age not found."})
        user_age = user_doc["age"]

        # print("recommendations called.")
        recommended_genres = await get_recommendations(userId)
        # print("recommendations got")
        print("recommended_genres",recommended_genres)

        # 2. Get viewed URLs from user_interactions_collection
        viewed_docs = await user_interactions_collection.find({"userId": userId}).to_list(length=None)
        viewed_urls = {doc.get("videoUrl") for doc in viewed_docs if doc.get("videoUrl")}

        # 3. Fetch all video documents
        video_docs = await reels_collection.find({}).to_list(length=None)
        video_candidates = []

        for video in video_docs:
            video_url = video.get("videoUrl", "").strip()
            video_id = str(video.get("_id"))
            if not video_url or video_url in viewed_urls:
                continue

            age_group = video.get("age_group", "")
            if not age_group or "-" not in age_group:
                continue
            try:
                min_age, max_age = map(int, age_group.split("-"))
            except ValueError:
                continue
            if not (min_age <= user_age <= max_age):
                continue  # Not appropriate for the user

            genre_list = video.get("genres", [])
            # print("genre_list", genre_list)
            if not isinstance(genre_list, list):
                continue

            # Normalize genre matching (optional but helps avoid case issues)
            genre_list_normalized = [g.lower() for g in genre_list]
            recommended_genres_normalized = [g.lower() for g in recommended_genres]

            matched_weights = [
                len(recommended_genres_normalized) - recommended_genres_normalized.index(g)
                for g in genre_list_normalized if g in recommended_genres_normalized
            ]

            if matched_weights:
                max_weight = max(matched_weights)
                video_id = str(video.get("_id"))  # Convert ObjectId to string
                video_candidates.append((max_weight, video_url, video_id))

        # Sort and select top candidates
        video_candidates.sort(reverse=True)

        # Extract (url, _id) pairs
        selected_items = [(url, _id) for _, url, _id in video_candidates[:count]]

        if not selected_items:
            return JSONResponse(status_code=404, content={"message": "No new videos found for this user."})

        return {
            "userId": userId,
            "recommended_genres": recommended_genres,
            "next_videos": selected_items  # returns list of (url, _id)
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
def init_user_interaction_router():
    """Initialize the router"""
    return router