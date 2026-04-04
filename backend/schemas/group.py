from pydantic import BaseModel, Field
from typing import List, Optional

class Participant(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(default="", description="Mandatory email to identify and link participants to their accounts")
    color: Optional[str] = Field(None, description="Optional hex color code usually for UI avatars")
    is_registered_user: bool = Field(default=False)

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Name of the expense group (e.g. 'Goa Trip')")
    
    # We strictly enforce the internship limitation right here! 
    # A list of minimum 1 person, and maximum 4 people.
    participants: List[Participant] = Field(..., min_length=1, max_length=4)

class GroupOut(GroupCreate):
    id: str
    creator_id: str  # The ID of the authenticated user who created the group

class GroupUpdate(BaseModel):
    name: str = Field(..., min_length=2, description="The new name for the expense group")
    participants: Optional[List[Participant]] = Field(None, description="Optional new list of participants")
