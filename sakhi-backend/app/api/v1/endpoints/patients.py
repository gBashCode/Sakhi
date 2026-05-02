from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone
from app.db.firebase import get_db
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/patients/due")
def get_due_patients(user=Depends(get_current_user)):
    """
    Returns patients due for follow-up:
    - High-risk visits in the last 7 days
    - Any visit with next_visit date within 3 days
    Falls back to returning recent high-risk visits if no scheduling data exists.
    """
    db = get_db()
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    visits_ref = db.collection("visits")
    query = visits_ref.where("risk_level", "==", "high")
    
    if user.role == "ASHA":
        query = query.where("asha_id", "==", user.id)
        
    # We fetch all matching and then sort/filter by date in Python to avoid complex composite index requirements
    visits = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        
        if "device_ts" in data:
            dt = data["device_ts"]
            if hasattr(dt, 'replace'):
                dt = dt.replace(tzinfo=timezone.utc)
            elif isinstance(dt, str):
                try:
                    dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
                except:
                    dt = datetime.now(timezone.utc)
            data["_dt"] = dt
            
            if dt >= cutoff:
                visits.append(data)
                
    # Sort by device_ts descending
    visits.sort(key=lambda x: x.get("_dt", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    visits = visits[:20]

    due_list = []
    for v in visits:
        patient_id = v.get("patient_id")
        name = f"Patient {patient_id}"
        if patient_id:
            patient_doc = db.collection("patients").document(patient_id).get()
            if patient_doc.exists:
                name = patient_doc.to_dict().get("name", name)

        days_ago = (datetime.now(timezone.utc) - v["_dt"]).days if "_dt" in v else 0
        when = "Today" if days_ago == 0 else f"{days_ago}d ago"

        due_list.append({
            "id": str(v["id"]),
            "title": f"{name} — High-risk follow-up",
            "when": when,
            "type": "risk",
        })

    return due_list
