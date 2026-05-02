from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class Patient(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    phone: Optional[str] = None
    lmp_date: Optional[date] = None
    village_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
