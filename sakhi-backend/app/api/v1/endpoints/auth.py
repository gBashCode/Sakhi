from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserLogin, UserCreate, Token, UserOut
from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_pin, get_pin_hash, create_access_token

router = APIRouter()

@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if user:
        raise HTTPException(status_code=400, detail="Phone already registered")
    
    new_user = User(
        phone=data.phone,
        name=data.name,
        pin_hash=get_pin_hash(data.pin),
        role="ASHA"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "role": new_user.role,
        },
    }

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="Phone number not registered")
    if not verify_pin(data.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "role": user.role,
        },
    }
