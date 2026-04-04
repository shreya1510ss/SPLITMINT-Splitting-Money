from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from bson import ObjectId
from database.mongo import database
from schemas.expense import ExpenseCreate, ExpenseOut
from services.expense_service import calculate_splits

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

@router.post("/", response_model=ExpenseOut)
async def create_expense(expense_in: ExpenseCreate):
    # 1. Process the mathematical logic for splits BEFORE touching the database
    calculated_expense = calculate_splits(expense_in)
        
    # 2. Convert to a standard dictionary for MongoDB
    expense_dict = calculated_expense.model_dump()
    
    # 3. Save into MongoDB's 'expenses' collection
    new_expense = await database.expenses.insert_one(expense_dict)
    
    # 4. Fetch the newly created expense from the database
    created_expense = await database.expenses.find_one({"_id": new_expense.inserted_id})
    
    # 5. Format it nicely (MongoDB uses _id, our model uses id)
    created_expense["id"] = str(created_expense["_id"])
    return created_expense

@router.get("/group/{group_id}")
async def get_group_expenses(
    group_id: str,
    search: Optional[str] = Query(None, description="Search by expense description"),
    participant: Optional[str] = Query(None, description="Filter by participant (payer or split)"),
    start_date: Optional[datetime] = Query(None, description="Filter from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter until this date"),
    min_amount: Optional[float] = Query(None, description="Filter by minimum amount"),
    max_amount: Optional[float] = Query(None, description="Filter by maximum amount")
):
    """Fetch expenses with optional search and filtering capabilities"""
    # 1. Base filter: Always lock the query to the specific group
    query = {"group_id": group_id}

    # 2. Text Search (Case-insensitive)
    if search:
        query["description"] = {"$regex": search, "$options": "i"}

    # 3. Participant Filter (Payer OR in splits)
    if participant:
        query["$or"] = [
            {"payer_name": participant},
            {"splits.participant_name": participant}
        ]

    # 4. Date Range Filter
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter

    # 5. Amount Range Filter
    if min_amount is not None or max_amount is not None:
        amount_filter = {}
        if min_amount is not None:
            amount_filter["$gte"] = min_amount
        if max_amount is not None:
            amount_filter["$lte"] = max_amount
        query["amount"] = amount_filter

    # 6. Execute Query with "Newest First" Sorting
    cursor = database.expenses.find(query).sort("date", -1)
    expenses = await cursor.to_list(length=100)
    
    # 7. Format the documents to map _id to string for the frontend
    formatted_expenses = []
    for exp in expenses:
        exp["id"] = str(exp["_id"])
        del exp["_id"]
        formatted_expenses.append(exp)
        
    return formatted_expenses

@router.delete("/{expense_id}")
async def delete_expense(expense_id: str):
    # 1. Check if the string is a valid MongoDB ID format
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid Expense ID format")
        
    # 2. Convert string to ObjectId and delete
    result = await database.expenses.delete_one({"_id": ObjectId(expense_id)})
    
    # 3. Handle failure if the ID did not match any document
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    return {"message": "Expense deleted successfully"}

@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(expense_id: str, expense_in: ExpenseCreate):
    # 1. Check if the string is a valid MongoDB ID format
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid Expense ID format")
        
    # 2. Process the mathematical logic for splits BEFORE touching the database
    calculated_expense = calculate_splits(expense_in)
        
    # 3. Convert to a standard dictionary for MongoDB
    expense_dict = calculated_expense.model_dump()
    
    # 4. Update in MongoDB's 'expenses' collection
    result = await database.expenses.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": expense_dict}
    )
    
    # 5. Handle failure if the ID did not match any document
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    # 6. Fetch the newly updated expense
    updated_expense = await database.expenses.find_one({"_id": ObjectId(expense_id)})
    
    # 7. Format it nicely (MongoDB uses _id, our model uses id)
    updated_expense["id"] = str(updated_expense["_id"])
    return updated_expense

@router.patch("/{expense_id}/toggle-check", response_model=ExpenseOut)
async def toggle_expense_checked(expense_id: str):
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid Expense ID format")
    
    # 1. Fetch current status
    expense = await database.expenses.find_one({"_id": ObjectId(expense_id)})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # 2. Toggle the boolean
    new_status = not expense.get("is_checked", False)
    
    # 3. Update in DB
    await database.expenses.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": {"is_checked": new_status}}
    )
    
    # 4. Return updated expense
    updated_expense = await database.expenses.find_one({"_id": ObjectId(expense_id)})
    updated_expense["id"] = str(updated_expense["_id"])
    return updated_expense
