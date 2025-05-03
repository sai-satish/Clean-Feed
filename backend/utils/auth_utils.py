from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.hash import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr
import jose.jwt as jwt
from jose import JWTError
import os
from dotenv import load_dotenv
from pymongo.errors import DuplicateKeyError
import logging
from utils.db_utils import *

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Load environment variables
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-if-not-in-env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security schemes
security = HTTPBearer()

# Models
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class UserResponse(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginModel(BaseModel):
    email: EmailStr
    password: str

# Helper functions - Using bcrypt directly instead of CryptContext
def verify_password(plain_password, hashed_password):
    return bcrypt.verify(plain_password, hashed_password)

def get_password_hash(password):
    return bcrypt.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user(email: str):
    user = await users_collection.find_one({"email": email})
    if user:
        user["id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    return None

def clean_user_data(user):
    """Removes sensitive data from user object for safe return to client"""
    return {
        "id": str(user["_id"]) if "_id" in user else user.get("id", ""),
        "email": user["email"],
        "name": user["name"]
    }

# Authentication functions
async def authenticate_user(email: str, password: str):
    user = await get_user(email)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

async def create_user(user: UserCreate):
    # Check if user already exists
    existing_user = await get_user(user.email)
    if existing_user:
        return False

    # Create new user
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }

    try:
        result = await users_collection.insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        return user_dict
    except DuplicateKeyError:
        return False

# Init function to be called at startup
async def init_auth():
    # Create unique index on email
    await users_collection.create_index("email", unique=True)

# Dependency to get current user from token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        logger.debug(f"Validating token: {token[:10]}...")

        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.warning("Token missing 'sub' claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get token data
        token_data = TokenData(email=email)
        logger.debug(f"Token validated for email: {email}")

    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error in token validation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication error",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    user = await get_user(email=token_data.email)
    if user is None:
        logger.warning(f"User not found for email: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

# For routes that require authentication
def get_current_active_user(current_user: dict = Depends(get_current_user)):
    return current_user