from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import redis
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.visit import Visit
from app.schemas.sync import SyncRequest, SyncResponse
from app.core.config import settings
from app.core.redis_client import r

router = APIRouter()

@router.post("/sync", response_model=SyncResponse)
def sync_visits(data: SyncRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved = 0; failed = []
    for v in data.visits:
        try:
            exists = db.query(Visit).filter(Visit.client_id == v.client_id).first()
            if exists: continue
            db_visit = Visit(**v.model_dump(), asha_id=current_user.id)
            db.add(db_visit)
            db.commit()
            saved += 1
            if v.risk_level == 'high':
                alert_msg = f"High Risk: {v.client_id[:8]}.. | BP: {v.bp_sys}/{v.bp_dia} | Symptoms: {', '.join(v.symptoms) if v.symptoms else 'None'}"
                r.lpush(f"alerts:phc:{current_user.village_id}", alert_msg)
        except Exception as e:
            failed.append({"client_id": str(v.client_id), "error": str(e)})
    return {"saved": saved, "failed": failed, "server_ts": datetime.utcnow()}


from app.models.patient import Patient
from typing import Any

@router.post("/sync/patients")
def sync_patients(
    data: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upsert patients sent from the ASHA device."""
    patients = data.get("patients", [])
    saved = 0
    for p in patients:
        try:
            existing = db.query(Patient).filter(Patient.id == p.get("id")).first()
            if existing:
                continue  # already exists — skip
            new_patient = Patient(
                id=p.get("id"),
                name=p.get("name", "Unknown"),
                asha_id=current_user.id,
            )
            db.add(new_patient)
            db.commit()
            saved += 1
        except Exception:
            db.rollback()
    return {"saved": saved, "server_ts": datetime.utcnow()}
