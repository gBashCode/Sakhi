from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class VisitOut(BaseModel):
    id: UUID
    patient_id: UUID
    bp_sys: int | None
    risk_level: str
    device_ts: datetime
    class Config: 
        from_attributes = True
