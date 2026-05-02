from pydantic import BaseModel

class UserLogin(BaseModel): 
    phone: str
    pin: str

class UserCreate(BaseModel):
    phone: str
    pin: str
    name: str

class UserOut(BaseModel):
    id: str
    name: str
    role: str
    class Config: 
        from_attributes = True

class Token(BaseModel): 
    access_token: str
    token_type: str = "bearer"
    user: UserOut
