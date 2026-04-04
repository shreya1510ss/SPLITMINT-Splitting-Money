from fastapi import APIRouter, HTTPException
from database.mongo import database
from services.balance_service import calculate_group_stats, simplify_debts
from bson import ObjectId

router = APIRouter(prefix="/api/balances", tags=["balances"])

@router.get("/{group_id}")
async def get_group_balances(group_id: str):
    """
    Fetches all expenses for a group and computes net balances, stats, and simplified debts.
    """
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid Group ID format")

    # 1. Fetch group metadata (for participant colors/names)
    group = await database.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # 2. Fetch all expenses
    cursor = database.expenses.find({"group_id": group_id})
    expenses = await cursor.to_list(length=None)

    # 3. Fetch all settlements
    settlements_cursor = database.settlements.find({"group_id": group_id})
    settlements = await settlements_cursor.to_list(length=None)
    for s in settlements:
        s["id"] = str(s.pop("_id"))

    # 4. Calculate statistics (now factoring in settlements)
    stats = calculate_group_stats(expenses, settlements)
    net_balances = stats["net_balances"]
    
    # 5. Simplify debts
    transactions = simplify_debts(net_balances)

    # 6. Calculate total group spending
    total_spent = sum(exp.get("amount", 0.0) for exp in expenses)

    return {
        "total_spent": round(total_spent, 2),
        "net_balances": net_balances,
        "transactions": transactions,
        "contributions": stats["contributions"],
        "shares": stats["shares"],
        "frequency": stats["frequency"],
        "participants": group.get("participants", []),
        "settlements": settlements
    }
