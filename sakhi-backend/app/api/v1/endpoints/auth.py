from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserLogin, Token, UserOut
from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_pin, create_access_token

router = APIRouter()

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_pin(data.pin, user.pin_hash):
        raise HTTPException(status_code=400, detail="Incorrect phone or pin")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}
