from fastapi import APIRouter, Depends
from datetime import datetime
import redis
from typing import Any
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.sync import SyncRequest, SyncResponse
from app.core.config import settings
from app.core.redis_client import r
from app.db.firebase import get_db as get_firestore

router = APIRouter()

@router.post("/sync", response_model=SyncResponse)
def sync_visits(data: SyncRequest, current_user: User = Depends(get_current_user)):
    db = get_firestore()
    saved = 0; failed = []
    visits_ref = db.collection('visits')
    
    for v in data.visits:
        try:
            # Check if exists
            docs = visits_ref.where('client_id', '==', v.client_id).limit(1).stream()
            if any(True for _ in docs):
                continue
            
            visit_data = v.model_dump()
            visit_data['asha_id'] = str(current_user.id)
            if isinstance(visit_data.get('device_ts'), datetime):
                visit_data['device_ts'] = visit_data['device_ts'].isoformat()
            
            visits_ref.add(visit_data)
            saved += 1
            if v.risk_level == 'high':
                alert_msg = f"High Risk: {v.client_id[:8]}.. | BP: {v.bp_sys}/{v.bp_dia} | Symptoms: {', '.join(v.symptoms) if v.symptoms else 'None'}"
                r.lpush(f"alerts:phc:{current_user.village_id}", alert_msg)
        except Exception as e:
            failed.append({"client_id": str(v.client_id), "error": str(e)})
    return {"saved": saved, "failed": failed, "server_ts": datetime.utcnow()}


@router.post("/sync/patients")
def sync_patients(
    data: dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    """Upsert patients sent from the ASHA device into Firestore."""
    db = get_firestore()
    patients = data.get("patients", [])
    saved = 0
    patients_ref = db.collection('patients')
    
    for p in patients:
        try:
            doc_id = p.get("id")
            if not doc_id:
                continue
                
            doc_ref = patients_ref.document(doc_id)
            doc = doc_ref.get()
            if doc.exists:
                continue  # already exists — skip
            
            patient_data = p.copy()
            patient_data["asha_id"] = str(current_user.id)
            patient_data["synced_at"] = datetime.utcnow().isoformat()
            
            doc_ref.set(patient_data)
            saved += 1
        except Exception as e:
            print(f"Error saving patient: {e}")
            
    return {"saved": saved, "server_ts": datetime.utcnow()}
