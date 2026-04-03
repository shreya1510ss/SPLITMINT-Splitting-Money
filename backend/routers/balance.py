from fastapi import APIRouter, HTTPException
from database.mongo import database
from services.balance_service import calculate_net_balances, simplify_debts

router = APIRouter(prefix="/api/balances", tags=["balances"])

@router.get("/{group_id}")
async def get_group_balances(group_id: str):
    """
    Fetches all expenses for a group and computes the net balances and simplified debt transactions.
    """
    cursor = database.expenses.find({"group_id": group_id})
    expenses = await cursor.to_list(length=None)

    if not expenses:
        return {
            "net_balances": {},
            "transactions": [],
            "message": "No expenses found for this group."
        }

    # 1. Calculate the raw final tallies for each person
    net_balances = calculate_net_balances(expenses)

    # 2. Run the greedy matching algorithm to find out who pays whom
    transactions = simplify_debts(net_balances)

    # 3. Calculate total group spending
    total_spent = sum(exp.get("amount", 0.0) for exp in expenses)

    return {
        "total_spent": round(total_spent, 2),
        "net_balances": net_balances,
        "transactions": transactions
    }
