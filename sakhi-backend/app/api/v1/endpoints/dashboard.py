from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.redis_client import r

router = APIRouter()

@router.get("/alerts/phc")
def get_alerts(current_user = Depends(get_current_user)):
    if current_user.role not in ['ANM','PHC']: 
        raise HTTPException(403)
    try:
        alerts = r.lrange(f"alerts:phc:{current_user.village_id}", 0, 20)
        return {"alerts": [a.decode() if isinstance(a, bytes) else a for a in alerts]}
    except redis.exceptions.ConnectionError:
        return {"alerts": ["MOCKED ALERT: High risk: 1234 (Redis Offline)"]}

@router.get("/patients/due")
def get_due_patients(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # For hackathon: return mock
    return [
        {"id":"123","name":"Sunita","due_date":"2026-05-05","due_for":"ANC-2"},
        {"id":"124","name":"Kamala","due_date":"2026-05-06","due_for":"PNC-1"},
        {"id":"125","name":"Geeta","due_date":"2026-05-07","due_for":"Immunization"}
    ]
