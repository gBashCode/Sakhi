from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: str
    phone: str
    pin_hash: str
    name: str
    role: str = 'ASHA'
    village_id: Optional[str] = None
