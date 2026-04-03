from fastapi import APIRouter, HTTPException
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
async def get_group_expenses(group_id: str):
    """Fetch all expenses associated with a specific group"""
    # Grab up to 100 recent expenses for this group
    cursor = database.expenses.find({"group_id": group_id})
    expenses = await cursor.to_list(length=100)
    
    # Format the documents to map _id to string for the frontend
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
