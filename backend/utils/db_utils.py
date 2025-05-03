import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client.cleanfeed_db
reels_collection = db.reels
collection = db.userVideos
users_collection = db.users
user_interactions_collection = db.user_interactions_collection