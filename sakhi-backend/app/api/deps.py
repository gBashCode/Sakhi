from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.db.firebase import get_db
from app.core.config import settings
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try: 
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
    except JWTError: 
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db = get_db()
    user_doc = db.collection("users").document(user_id).get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=401, detail="User not found")
        
    user_data = user_doc.to_dict()
    user_data["id"] = user_doc.id
    return User(**user_data)
