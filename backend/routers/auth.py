from fastapi import APIRouter, HTTPException, status, Header, Depends
from database.mongo import database
from schemas.user import UserCreate, UserLogin, UserOut
from schemas.auth import Token
from services.auth_service import hash_password, verify_password, create_access_token, decode_access_token
from datetime import timedelta
from typing import Optional, List
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])
ACCESS_TOKEN_EXPIRE_MINUTES = 480 # 8 hours for dev convenience

@router.get("/me", response_model=UserOut)
async def get_me(authorization: Optional[str] = Header(None)):
    """
    Fetches the current user profile from the JWT Bearer token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Token expired or invalid")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    user = await database.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"]
    }

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

@router.get("/users/search", response_model=List[UserOut])
async def search_users(q: str):
    """
    Search for users by name or email (registered users only).
    """
    if not q or len(q) < 2:
        return []
    
    # Case insensitive search using regex in MongoDB
    cursor = database.users.find({
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    }).limit(10)
    
    results = []
    async for user in cursor:
        results.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        })
    
    return results
