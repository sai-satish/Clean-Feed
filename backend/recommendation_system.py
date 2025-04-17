# def predict_user_genres(userId):
#     import pandas as pd
#     import ast
#     import joblib

#     # Load model & tools
#     vectorizer = joblib.load("tfidf_vectorizer-v2.pkl")
#     mlb = joblib.load("genre_binarizer-v2.pkl")
#     classifier = joblib.load("genre_classifier-v2.pkl")

#     # Load user file
#     df = pd.read_csv(f"{userId}.csv")
#     df = df.drop(columns=['video_url'], errors='ignore')
#     df['tags'] = df['tags'].apply(ast.literal_eval)
#     df['genres'] = df['genres'].apply(ast.literal_eval)

#     # Optional: weigh tag importance
#     def boost_tags(row):
#         base_tags = row['tags']
#         if not row['liked']:
#             return []
#         weight = int(min(row['watch_duration'] / 30, 5))  # boost by duration
#         return base_tags * weight

#     df['boosted_tags'] = df.apply(boost_tags, axis=1)
#     all_tags = [tag for sublist in df['boosted_tags'] for tag in sublist]
#     print("all_tags", all_tags)
#     if not all_tags:
#         print("⚠️ No liked/watch-worthy tags found.")
#         return []

#     tag_string = " ".join(all_tags)

#     # Vectorize and predict
#     tag_vector = vectorizer.transform([tag_string])
#     prediction = classifier.predict(tag_vector)
#     predicted_genres = mlb.inverse_transform(prediction)
#     print(predicted_genres[0] if predicted_genres else [])
#     return predicted_genres[0] if predicted_genres else []

import asyncio


async def predict_user_genres(userId: str):
    import joblib
    from motor.motor_asyncio import AsyncIOMotorClient
    import os

    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.cleanfeed_db
    user_interactions_collection = db.user_interactions_collection

    # Load model and tools
    vectorizer = joblib.load("tfidf_vectorizer-v2.pkl")
    mlb = joblib.load("genre_binarizer-v2.pkl")
    classifier = joblib.load("genre_classifier-v2.pkl")

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
        print("boosted tags:", boosted)
        all_tags.extend(boosted)

    if not all_tags:
        print("⚠️ No liked/watch-worthy tags found.")
        return []

    tag_string = " ".join(all_tags)
    print("tag_string:", tag_string)

    tag_vector = vectorizer.transform([tag_string])
    print("tag_vector", tag_vector)
    prediction = classifier.predict(tag_vector)
    print("prediction", prediction)
    predicted_genres = mlb.inverse_transform(prediction)
    print("predicted_genres", predicted_genres)

    return predicted_genres[0] if predicted_genres else []

# asyncio.run(predict_user_genres("67fd77ef45ab1c8314a6e31c"))

# predict_user_genres(5678)