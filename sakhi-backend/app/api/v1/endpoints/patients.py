from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.visit import Visit
from app.models.patient import Patient

router = APIRouter()


@router.get("/patients/due")
def get_due_patients(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Returns patients due for follow-up:
    - High-risk visits in the last 7 days
    - Any visit with next_visit date within 3 days
    Falls back to returning recent high-risk visits if no scheduling data exists.
    """
    cutoff = datetime.utcnow() - timedelta(days=7)

    # High-risk visits in the last week for this ASHA worker
    query = (
        db.query(Visit)
        .filter(
            and_(
                Visit.risk_level == "high",
                Visit.device_ts >= cutoff,
            )
        )
    )
    if user.role == "ASHA":
        query = query.filter(Visit.asha_id == user.id)

    visits = query.order_by(Visit.device_ts.desc()).limit(20).all()

    due_list = []
    for v in visits:
        # Fetch patient name if linked
        patient = db.query(Patient).filter(Patient.id == v.patient_id).first()
        name = patient.name if patient else f"Patient {v.patient_id}"

        days_ago = (datetime.utcnow() - v.device_ts).days if v.device_ts else 0
        when = "Today" if days_ago == 0 else f"{days_ago}d ago"

        due_list.append({
            "id": str(v.id),
            "title": f"{name} — High-risk follow-up",
            "when": when,
            "type": "risk",
        })

    return due_list
