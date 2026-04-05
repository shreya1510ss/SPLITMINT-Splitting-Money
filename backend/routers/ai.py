from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from services.ai_service import AIService
from database.mongo import database
from bson import ObjectId

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/extract-expense")
async def extract_expense(
    text: str = Body(..., embed=True),
    group_id: str = Body(..., embed=True)
):
    """
    Extract expense details from natural language text.
    """
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")

    group = await database.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    participants = [p["name"] for p in group.get("participants", [])]
    
    try:
        extraction = await AIService.extract_expense(text, participants)
        return extraction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/group-summary/{group_id}")
async def get_group_summary(group_id: str):
    """
    Generate a summary of group spending.
    """
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")

    group = await database.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    participants = [p["name"] for p in group.get("participants", [])]
    
    # Fetch all expenses
    cursor = database.expenses.find({"group_id": group_id})
    expenses = await cursor.to_list(length=None)
    
    if not expenses:
        return {"summary": "No expenses found for this group yet.", "top_spender": None, "total_spent": 0}

    try:
        summary = await AIService.generate_group_summary(expenses, participants)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settlement-suggestions")
async def suggest_settlements(
    balances: dict = Body(..., embed=True),
    transactions: List[dict] = Body(..., embed=True)
):
    """
    Suggest settlement paths based on current balances.
    """
    try:
        suggestion = await AIService.suggest_settlements(balances, transactions)
        return suggestion
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
