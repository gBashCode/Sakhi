from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Visit(BaseModel):
    id: str
    client_id: Optional[str] = None
    patient_id: Optional[str] = None
    asha_id: Optional[str] = None
    bp_sys: Optional[int] = None
    bp_dia: Optional[int] = None
    weight: Optional[float] = None
    symptoms: List[str] = Field(default_factory=list)
    risk_level: str = 'low'
    device_ts: datetime
    server_ts: datetime = Field(default_factory=datetime.utcnow)
    synced: bool = True
