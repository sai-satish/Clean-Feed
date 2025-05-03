# Authentication endpoints
from fastapi import APIRouter, HTTPException, Depends
from datetime import timedelta
from utils.auth_utils import Token, UserCreate, LoginModel, create_user, authenticate_user, create_access_token, get_current_active_user, clean_user_data

router = APIRouter(prefix="/auth",tags=["Authorization"])

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    user_data = await create_user(user)
    if not user_data:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Generate token for auto-login after signup
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Clean user data for response (remove sensitive fields)
    user_response = clean_user_data(user_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/login", response_model=Token)
async def login(login_data: LoginModel):
    user = await authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )

    # Clean user data for response (remove sensitive fields)
    user_response = clean_user_data(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    # Clean user data for response
    user_data = clean_user_data(current_user)
    return user_data

# Debug endpoint to test token validation
@router.get("/validate-token")
async def validate_token(current_user: dict = Depends(get_current_active_user)):
    return {"message": "Token is valid", "user_id": str(current_user["_id"])}

def init_auth_router():
    """Initialize the router"""
    return router