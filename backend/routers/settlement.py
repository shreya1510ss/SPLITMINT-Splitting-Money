from fastapi import APIRouter, HTTPException
from database.mongo import database
from schemas.settlement import SettlementCreate, SettlementOut
from typing import List
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/settlements", tags=["settlements"])

@router.post("/", response_model=SettlementOut)
async def create_settlement(settlement: SettlementCreate):
    """
    Records a settlement between two participants.
    """
    settlement_dict = settlement.model_dump()
    settlement_dict["created_at"] = datetime.utcnow()
    
    result = await database.settlements.insert_one(settlement_dict)
    
    created_settlement = await database.settlements.find_one({"_id": result.inserted_id})
    created_settlement["id"] = str(created_settlement["_id"])
    return created_settlement

@router.get("/group/{group_id}", response_model=List[SettlementOut])
async def get_group_settlements(group_id: str):
    """
    Fetches all completed settlements for a given group.
    """
    cursor = database.settlements.find({"group_id": group_id})
    settlements = await cursor.to_list(length=100)
    
    for s in settlements:
        s["id"] = str(s["_id"])
        
    return settlements
