from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.visit import Visit
from app.schemas.visit import VisitOut

router = APIRouter()

@router.get("/visits", response_model=list[VisitOut])
def list_visits(db: Session = Depends(get_db), user = Depends(get_current_user)):
    if user.role == 'ASHA': 
        return db.query(Visit).filter(Visit.asha_id == user.id).all()
    else: 
        return db.query(Visit).limit(50).all() # ANM sees all
