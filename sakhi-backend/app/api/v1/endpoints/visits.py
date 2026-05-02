from fastapi import APIRouter, Depends
from app.db.firebase import get_db
from app.api.deps import get_current_user
from app.schemas.visit import VisitOut

router = APIRouter()

@router.get("/visits", response_model=list[VisitOut])
def list_visits(user = Depends(get_current_user)):
    db = get_db()
    visits_ref = db.collection("visits")
    if user.role == 'ASHA': 
        query = visits_ref.where("asha_id", "==", user.id).stream()
    else: 
        query = visits_ref.limit(50).stream() # ANM sees all
        
    result = []
    for doc in query:
        data = doc.to_dict()
        data['id'] = doc.id
        result.append(data)
    return result
