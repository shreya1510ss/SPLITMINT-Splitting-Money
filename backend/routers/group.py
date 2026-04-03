from fastapi import APIRouter, HTTPException
from bson import ObjectId
from database.mongo import database
from schemas.group import GroupCreate, GroupOut

router = APIRouter(prefix="/api/groups", tags=["groups"])

# -------------------------------------------------------------
# 1. CREATE GROUP ENDPOINT
# -------------------------------------------------------------
@router.post("/", response_model=GroupOut)
async def create_group(group: GroupCreate, creator_id: str):
    """
    Creates a new expense group with up to 4 participants.
    In a fully secure app, `creator_id` would be extracted automatically from the JWT Token!
    """
    # 1. Convert the Pydantic schema into a standard Python dictionary
    group_dict = group.model_dump()
    
    # 2. Attach the creator's ID to the group
    group_dict["creator_id"] = creator_id
    
    # 3. Save into MongoDB's 'groups' collection
    new_group = await database.groups.insert_one(group_dict)
    
    # 4. Fetch the newly created group from the database
    created_group = await database.groups.find_one({"_id": new_group.inserted_id})
    
    # 5. Return it formatted nicely
    return {
        "id": str(created_group["_id"]),
        "name": created_group["name"],
        "participants": created_group["participants"],
        "creator_id": created_group["creator_id"]
    }

# =============================================================
# 🛑 TODO EXERCISES FOR YOU:
# =============================================================
# Try building these two endpoints yourself!

# @router.get("/{group_id}")
# async def get_group(group_id: str):
#     # Hint: Use `await database.groups.find_one(...)`
#     pass

# @router.delete("/{group_id}")
# async def delete_group(group_id: str):
#     # Hint: Use `await database.groups.delete_one(...)`
#     pass

@router.delete("/{group_id}")
async def delete_group(group_id: str):
    # 1. Check if the string is a valid MongoDB ID format
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
        
    # 2. We MUST convert the string into a MongoDB ObjectId!
    result = await database.groups.delete_one({"_id": ObjectId(group_id)})
    
    # 3. Check if anything was actually deleted (to prevent false successes)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
        
    return {"message": "Group deleted successfully"}
