from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import List, Optional

class VisitSyncIn(BaseModel):
    client_id: str
    patient_id: str
    bp_sys: Optional[int] = None
    bp_dia: Optional[int] = None
    weight: Optional[float] = None
    symptoms: List[str] = []
    risk_level: str = "low"
    device_ts: datetime

class SyncRequest(BaseModel): 
    visits: List[VisitSyncIn]

class SyncResponse(BaseModel): 
    saved: int
    failed: List[dict] = []
    server_ts: datetime
