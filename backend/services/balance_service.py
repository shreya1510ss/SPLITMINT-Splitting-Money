from typing import List, Dict

def calculate_group_stats(expenses: List[dict], settlements: List[dict] = None) -> dict:
    """
    Computes detailed group-level stats for dashboards.
    """
    net_balances = {}
    contributions = {}
    shares = {}
    frequency = {}

    for expense in expenses:
        payer = expense.get("payer_name")
        amount = expense.get("amount", 0.0)
        
        # 1. Update Contributions (Total Paid) & Frequency
        contributions[payer] = contributions.get(payer, 0.0) + amount
        frequency[payer] = frequency.get(payer, 0) + 1
        
        # 2. Update Net Balances (Payer gets credit)
        net_balances[payer] = net_balances.get(payer, 0.0) + amount

        # 3. Update Shares (Total Consumed) & deduct from Net
        splits = expense.get("splits", [])
        for split in splits:
            participant = split.get("participant_name")
            owed_share = split.get("owed_share", 0.0)

            shares[participant] = shares.get(participant, 0.0) + owed_share
            net_balances[participant] = net_balances.get(participant, 0.0) - owed_share

    # 4. Integrate Settlements (credits that offset debts)
    if settlements:
        for s in settlements:
            from_name = s.get("from_name")
            to_name = s.get("to_name")
            amount = s.get("amount", 0.0)
            
            # The person who paid getting the debt removed (balance increases)
            net_balances[from_name] = net_balances.get(from_name, 0.0) + amount
            # The person who received having their credit removed (balance decreases)
            net_balances[to_name] = net_balances.get(to_name, 0.0) - amount

    # Rounding and cleaning up results
    return {
        "net_balances": {k: round(v, 2) for k, v in net_balances.items() if abs(v) > 0.01},
        "contributions": {k: round(v, 2) for k, v in contributions.items()},
        "shares": {k: round(v, 2) for k, v in shares.items()},
        "frequency": frequency
    }

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
