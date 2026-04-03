from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, description="The user's full name")
    email: EmailStr = Field(..., description="A valid email address")
    password: str = Field(..., min_length=6, description="A strong password")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
