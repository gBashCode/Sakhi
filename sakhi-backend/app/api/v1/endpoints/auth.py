from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user import UserLogin, UserCreate, Token, UserOut
from app.db.firebase import get_db
from app.models.user import User
from app.core.security import verify_pin, get_pin_hash, create_access_token
import uuid

router = APIRouter()

@router.post("/register", response_model=Token)
def register(data: UserCreate):
    db = get_db()
    users_ref = db.collection("users")
    query = users_ref.where("phone", "==", data.phone).limit(1).stream()
    
    existing_user = list(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone already registered")
    
    new_id = str(uuid.uuid4())
    new_user_data = {
        "phone": data.phone,
        "name": data.name,
        "pin_hash": get_pin_hash(data.pin),
        "role": "ASHA"
    }
    
    users_ref.document(new_id).set(new_user_data)

    token = create_access_token({"sub": new_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_id,
            "name": new_user_data["name"],
            "role": new_user_data["role"],
        },
    }

@router.post("/login", response_model=Token)
def login(data: UserLogin):
    db = get_db()
    users_ref = db.collection("users")
    query = users_ref.where("phone", "==", data.phone).limit(1).stream()
    
    users = list(query)
    if not users:
        raise HTTPException(status_code=404, detail="Phone number not registered")
        
    user_doc = users[0]
    user_data = user_doc.to_dict()
    
    if not verify_pin(data.pin, user_data.get("pin_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid PIN")
        
    token = create_access_token({"sub": user_doc.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_doc.id,
            "name": user_data.get("name", ""),
            "role": user_data.get("role", "ASHA"),
        },
    }
