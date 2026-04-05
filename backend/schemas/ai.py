from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from .expense import SplitMode

class ParticipantSplit(BaseModel):
    name: str = Field(..., description="Name of the participant")
    value: float = Field(..., description="Their share (percentage or custom amount)")

class AIExpenseExtraction(BaseModel):
    description: str = Field(..., description="The description of the expense")
    amount: float = Field(..., description="The total amount of the expense")
    payer_name: Optional[str] = Field(None, description="The name of the person who paid")
    category: Optional[str] = Field(None, description="The suggested category for the expense")
    split_mode: SplitMode = Field(default=SplitMode.EQUAL, description="The suggested split mode")
    participants: Optional[List[str]] = Field(None, description="The names of participants involved in the split. If null, all group members are included.")
    split_details: Optional[List[ParticipantSplit]] = Field(None, description="List of participant names and their shares (percentage or custom amount). Only used for 'custom' or 'percentage' modes.")

class AIGroupSummary(BaseModel):
    summary: str = Field(..., description="A readable summary of group spending and dynamics")
    top_spender: Optional[str] = Field(None, description="The person who spent the most")
    total_spent: float = Field(..., description="Total amount spent by the group")

class AISettlementSuggestion(BaseModel):
    suggestion: str = Field(..., description="A friendly suggestion on how to settle balances")
    optimized_path: List[dict] = Field(..., description="A list of suggested transfers")
