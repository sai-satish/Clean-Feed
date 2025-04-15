from pydantic import BaseModel, Field
from typing import List
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, ObjectId):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            v = ObjectId(v)
        return str(v)

class ReelModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    videoUrl: str
    age_group: str
    tags: List[str]
    genres: List[str]
    userId: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "videoUrl": "https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4",
                "age_group": "13-18",
                "tags": ["dance", "comedy", "trending"],
                "genres": ["Comedy", "Entertainment"],
                "userId": "67fd69e1aab3bb979c9a529c"
            }
        }