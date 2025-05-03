from fastapi import Depends
from utils.auth_utils import get_current_active_user
from utils.db_utils import *


async def predict_user_genres(userId: str):
    import joblib


    # Load model and tools
    vectorizer = joblib.load("models/tfidf_vectorizer-v2.pkl")
    mlb = joblib.load("models/genre_binarizer-v2.pkl")
    classifier = joblib.load("models/genre_classifier-v2.pkl")

    user_docs = await user_interactions_collection.find({"userId": userId}).to_list(length=None)
    if not user_docs:
        print("⚠️ No user documents found.")
        return []

    def boost_tags(entry):
        # Only use relevant fields
        liked = entry.get("liked", False)
        tags = entry.get("tags", [])
        watch_duration = entry.get("watch_duration", 0)

        if not liked or not isinstance(tags, list):
            return []

        weight = int(min(watch_duration / 30, 5))
        return tags# * weight if weight > 0 else []

    all_tags = []
    for doc in user_docs:
        # Strip to only relevant fields (optional debug/cleanup)
        relevant_doc = {
            "tags": doc.get("tags", []),
            "liked": doc.get("liked", False),
            "watch_duration": doc.get("watch_duration", 0),
        }

        boosted = boost_tags(relevant_doc)
        all_tags.extend(boosted)

    if not all_tags:
        print("⚠️ No liked/watch-worthy tags found.")
        return []

    tag_string = " ".join(all_tags)

    tag_vector = vectorizer.transform([tag_string])
    prediction = classifier.predict(tag_vector)
    predicted_genres = mlb.inverse_transform(prediction)

    return predicted_genres[0] if predicted_genres else []

async def get_recommendations(userId: str, current_user: dict = Depends(get_current_active_user)):
    predicted = await predict_user_genres(userId)
    return predicted