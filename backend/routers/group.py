from fastapi import APIRouter, HTTPException
from bson import ObjectId
from database.mongo import database
from schemas.group import GroupCreate, GroupOut, Participant, GroupUpdate
from typing import List, Optional

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

# -------------------------------------------------------------
# 5. GET ALL GROUPS
# -------------------------------------------------------------
@router.get("/", response_model=List[GroupOut])
async def get_all_groups(user_id: Optional[str] = None, user_email: Optional[str] = None):
    """
    Fetches groups for a user. 
    It returns groups created by the user OR where the user is a participant.
    """
    query = {}
    
    if user_id and user_email:
        # Match groups where user is creator OR user is in the participants list by email
        query = {
            "$or": [
                {"creator_id": user_id},
                {"participants.email": user_email}
            ]
        }
    elif user_id:
        query["creator_id"] = user_id
    elif user_email:
        query["participants.email"] = user_email
        
    cursor = database.groups.find(query)
    groups = await cursor.to_list(length=100)
    
    # Format for frontend
    for group in groups:
        group["id"] = str(group["_id"])
        
    return groups

# -------------------------------------------------------------
# 6. GET SINGLE GROUP
# -------------------------------------------------------------
@router.get("/{group_id}", response_model=GroupOut)
async def get_group(group_id: str):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
        
    group = await database.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    group["id"] = str(group["_id"])
    return group

@router.delete("/{group_id}")
async def delete_group(group_id: str):
    # 1. Check if the string is a valid MongoDB ID format
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
        
    # 1. CASCADE DELETE: Delete all expenses linked to this group first
    await database.expenses.delete_many({"group_id": group_id})
    
    # 2. Finally, delete the group itself
    result = await database.groups.delete_one({"_id": ObjectId(group_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
        
    return {"message": "Group and all its expenses deleted successfully"}

# -------------------------------------------------------------
# 1B. EDIT GROUP NAME
# -------------------------------------------------------------
@router.patch("/{group_id}", response_model=GroupOut)
async def update_group(group_id: str, group_update: GroupUpdate):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
    
    # 1. Update the name in MongoDB
    result = await database.groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$set": {"name": group_update.name}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # 2. Return the freshly updated group
    updated_group = await database.groups.find_one({"_id": ObjectId(group_id)})
    updated_group["id"] = str(updated_group["_id"])
    return updated_group

@router.put("/{group_id}", response_model=GroupOut)
async def fully_update_group(group_id: str, group_update: GroupUpdate):
    """
    Updates both name and participants list for a group in a single transaction.
    """
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
    
    update_data = {"name": group_update.name}
    if group_update.participants is not None:
        update_data["participants"] = [p.model_dump() for p in group_update.participants]
        
    result = await database.groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
        
    updated_group = await database.groups.find_one({"_id": ObjectId(group_id)})
    updated_group["id"] = str(updated_group["_id"])
    return updated_group

# -------------------------------------------------------------
# 2. ADD PARTICIPANTS
# -------------------------------------------------------------
@router.post("/{group_id}/participants", response_model=GroupOut)
async def add_participants(group_id: str, new_participants: List[Participant]):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
    
    # 1. Fetch current group
    group = await database.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # 2. Check internship limit (max 4)
    current_participants = group.get("participants", [])
    if len(current_participants) + len(new_participants) > 4:
        raise HTTPException(status_code=400, detail="Groups can have a maximum of 4 participants.")
    
    # 3. Prevent duplicate names
    existing_names = {p["name"] for p in current_participants}
    for p in new_participants:
        if p.name in existing_names:
            raise HTTPException(status_code=400, detail=f"Participant '{p.name}' already exists in this group.")
    
    # 4. Add them!
    converted_participants = [p.model_dump() for p in new_participants]
    result = await database.groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$push": {"participants": {"$each": converted_participants}}}
    )
    
    # 5. Return the updated group
    updated_group = await database.groups.find_one({"_id": ObjectId(group_id)})
    updated_group["id"] = str(updated_group["_id"])
    return updated_group

# -------------------------------------------------------------
# 3. EDIT PARTICIPANT NAME
# -------------------------------------------------------------
@router.patch("/{group_id}/participants/{old_name}", response_model=GroupOut)
async def update_participant_name(group_id: str, old_name: str, new_name: str):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
    
    # 1. Update the name in the groups collection
    # MongoDB trick: use $[elem] to update a specific element in an array
    result = await database.groups.update_one(
        {"_id": ObjectId(group_id), "participants.name": old_name},
        {"$set": {"participants.$.name": new_name}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Participant or Group not found")
    
    # 2. UPDATE ALL LINKED EXPENSES (Payer Name)
    await database.expenses.update_many(
        {"group_id": group_id, "payer_name": old_name},
        {"$set": {"payer_name": new_name}}
    )
    
    # 3. UPDATE ALL LINKED EXPENSES (Splits)
    await database.expenses.update_many(
        {"group_id": group_id, "splits.participant_name": old_name},
        {"$set": {"splits.$.participant_name": new_name}}
    )
    
    updated_group = await database.groups.find_one({"_id": ObjectId(group_id)})
    updated_group["id"] = str(updated_group["_id"])
    return updated_group

# -------------------------------------------------------------
# 4. REMOVE PARTICIPANT
# -------------------------------------------------------------
@router.delete("/{group_id}/participants/{name}")
async def remove_participant(group_id: str, name: str):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")
    
    # 1. Check if the participant is involved in any expenses!
    # We check both Payer and Splits
    linked_expense = await database.expenses.find_one({
        "group_id": group_id,
        "$or": [
            {"payer_name": name},
            {"splits.participant_name": name}
        ]
    })
    
    if linked_expense:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot remove '{name}' because they are linked to existing expenses. Delete the expenses first."
        )
    
    # 2. Remove them from the group's participant list
    result = await database.groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$pull": {"participants": {"name": name}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Participant not found in this group.")
        
    return {"message": f"Participant '{name}' removed successfully"}
