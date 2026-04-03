from typing import List, Dict

def calculate_net_balances(expenses: List[dict]) -> Dict[str, float]:
    """
    Computes positive and negative net balances for each person in a group.
    Returns: {"Alice": 25.0, "Bob": -15.0, "Charlie": -10.0}
    """
    balances = {}

    for expense in expenses:
        payer = expense.get("payer_name")
        amount = expense.get("amount", 0.0)
        
        # Payer paid the total amount, so they get a + credit initially
        if payer not in balances:
            balances[payer] = 0.0
        balances[payer] += amount

        # Now deduct everyone's exact consumed share 
        splits = expense.get("splits", [])
        for split in splits:
            participant = split.get("participant_name")
            owed_share = split.get("owed_share", 0.0)

            if participant not in balances:
                balances[participant] = 0.0
            
            balances[participant] -= owed_share

    # Round to 2 decimal places to avoid Python floating point anomalies
    return {k: round(v, 2) for k, v in balances.items() if round(abs(v), 2) > 0}

def simplify_debts(balances: Dict[str, float]) -> List[dict]:
    """
    Implements a greedy matching algorithm (who pays whom).
    Returns: [{"from": "Bob", "to": "Alice", "amount": 15.0}, ...]
    """
    debtors = []
    creditors = []

    for person, amount in balances.items():
        if amount < -0.001:  # less than 0 (owing money)
            debtors.append({"person": person, "amount": abs(amount)})
        elif amount > 0.001: # greater than 0 (owed money)
            creditors.append({"person": person, "amount": amount})

    # Sort by amount descending to minimize transactions more aggressively
    debtors.sort(key=lambda x: x["amount"], reverse=True)
    creditors.sort(key=lambda x: x["amount"], reverse=True)

    transactions = []
    
    i = 0  # debtors index
    j = 0  # creditors index

    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]

        # The amount to settle is the minimum of what debtor owes and what creditor receives
        settle_amount = min(debtor["amount"], creditor["amount"])
        settle_amount = round(settle_amount, 2)

        if settle_amount > 0:
            transactions.append({
                "from": debtor["person"],
                "to": creditor["person"],
                "amount": settle_amount
            })

        # Update remaining balances
        debtor["amount"] -= settle_amount
        creditor["amount"] -= settle_amount

        # Move indices if a balance is settled
        if debtor["amount"] < 0.001:
            i += 1
        if creditor["amount"] < 0.001:
            j += 1

    return transactions
