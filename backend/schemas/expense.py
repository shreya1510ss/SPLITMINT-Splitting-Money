from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Using an Enum to strictly enforce that these are the ONLY 3 split modes allowed!
class SplitMode(str, Enum):
    EQUAL = "equal"
    CUSTOM = "custom"
    PERCENTAGE = "percentage"

class ExpenseType(str, Enum):
    EXPENSE = "expense"
    SETTLEMENT = "settlement"

# A sub-model to track each person's exact share of an expense
class ExpenseSplit(BaseModel):
    participant_name: str = Field(..., description="Name of the participant involved")
    owed_share: float = Field(0.0, description="The exact monetary amount they owe. Overwritten by backend math if EQUAL/PERCENTAGE")
    percentage: Optional[float] = Field(None, description="Only used by the frontend if split_mode is PERCENTAGE")

class ExpenseCreate(BaseModel):
    group_id: str = Field(..., description="The ID of the group this expense belongs to")
    description: str = Field(..., min_length=2, description="What was this expense for? (e.g. Pizza)")
    amount: float = Field(..., gt=0, description="Total amount paid must be greater than exactly zero")
    date: datetime = Field(default_factory=datetime.utcnow)
    
    payer_name: str = Field(..., description="The name of the participant who paid the bill")
    split_mode: SplitMode = Field(default=SplitMode.EQUAL)
    type: ExpenseType = Field(default=ExpenseType.EXPENSE)
    is_checked: bool = Field(default=False)
    
    # This list tells us exactly who is involved in this specific expense, and their shares
    splits: List[ExpenseSplit]

class ExpenseOut(ExpenseCreate):
    id: str
