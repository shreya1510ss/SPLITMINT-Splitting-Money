from schemas.expense import ExpenseCreate, SplitMode
from fastapi import HTTPException

def calculate_splits(expense: ExpenseCreate) -> ExpenseCreate:
    """
    Takes an incoming ExpenseCreate request, calculates the exact mathematical 
    amounts each person owes based on the SplitMode, and returns the modified object.
    We are intercepting the web request to do the math cleanly in the background.
    """
    total_amount = expense.amount
    num_participants = len(expense.splits)
    
    if num_participants == 0:
        raise HTTPException(status_code=400, detail="Must have at least one participant.")
    
    # -------------------------------------------------------------
    # LOGIC 1: EQUAL SPLITS (With exact rounding)
    # -------------------------------------------------------------
    if expense.split_mode == SplitMode.EQUAL:
        # Standard division rounded to 2 decimal places (e.g. 10.00 / 3 = 3.33)
        base_share = round(total_amount / num_participants, 2)
        
        # Calculate exactly how many pennies were lost due to rounding
        # e.g. 10.00 - (3.33 * 3) = +0.01 missing!
        total_allocated = base_share * num_participants
        difference = round(total_amount - total_allocated, 2)
        
        for i, split in enumerate(expense.splits):
            split.owed_share = base_share
            
            # We magically dump the missing pennies directly onto the first person's tab
            # Now Person 1 owes 3.34, Person 2 owes 3.33, etc. Perfect math!
            if i == 0 and difference != 0:
                split.owed_share = round(split.owed_share + difference, 2)
                
    # -------------------------------------------------------------
    # LOGIC 2: PERCENTAGE SPLITS
    # -------------------------------------------------------------
    elif expense.split_mode == SplitMode.PERCENTAGE:
        # First: Guard against bad data! Do the percentages actually equal exactly 100?
        total_percent = sum([s.percentage for s in expense.splits if s.percentage is not None])
        if round(total_percent, 2) != 100.00:
            raise HTTPException(status_code=400, detail="The sum of percentages must equal exactly 100.")
            
        calculated_total = 0.0
        
        for split in expense.splits:
            if split.percentage is None:
                raise HTTPException(status_code=400, detail="Missing percentage for a participant")
                
            share = round((split.percentage / 100) * total_amount, 2)
            split.owed_share = share
            calculated_total += share
            
        # Optional safeguard: apply the same rounding trick to the first person
        # just in case fractional percentage math leaked a cent!
        difference = round(total_amount - calculated_total, 2)
        if difference != 0:
            expense.splits[0].owed_share = round(expense.splits[0].owed_share + difference, 2)
            
    # -------------------------------------------------------------
    # LOGIC 3: CUSTOM SPLITS
    # -------------------------------------------------------------
    elif expense.split_mode == SplitMode.CUSTOM:
        # Since the user input the custom numbers manually, our only job is to check if they lied!
        # Do their numbers perfectly add up to the total bill?
        total_custom = sum([s.owed_share for s in expense.splits])
        if round(total_custom, 2) != round(total_amount, 2):
            raise HTTPException(status_code=400, detail="Custom splits must add up to exactly the total amount.")

    return expense
