from fastapi import APIRouter, HTTPException, status
from database.mongo import database
from schemas.user import UserCreate, UserLogin, UserOut
from schemas.auth import Token
from services.auth_service import hash_password, verify_password, create_access_token
from datetime import timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])
ACCESS_TOKEN_EXPIRE_MINUTES = 60

@router.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    existing_user = await database.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    
    new_user = await database.users.insert_one(user_dict)
    created_user = await database.users.find_one({"_id": new_user.inserted_id})
    
    return {
        "id": str(created_user["_id"]),
        "name": created_user["name"],
        "email": created_user["email"]
    }

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await database.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": str(db_user["_id"])},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}
