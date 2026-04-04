from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SettlementBase(BaseModel):
    group_id: str
    from_name: str
    to_name: str
    amount: float = Field(..., gt=0)

class SettlementCreate(SettlementBase):
    pass

class SettlementOut(SettlementBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
