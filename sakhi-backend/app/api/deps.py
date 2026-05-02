from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try: 
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
    except JWTError: 
        raise HTTPException(status_code=401, detail="Invalid token")
    import uuid
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user: 
        raise HTTPException(status_code=401)
    return user
