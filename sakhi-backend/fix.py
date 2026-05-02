import sqlite3
import bcrypt

# Generate hash for '1234'
new_hash = bcrypt.hashpw(b'1234', bcrypt.gensalt()).decode()

conn = sqlite3.connect('sakhi.db')
c = conn.cursor()

# Update the user
c.execute("UPDATE users SET pin_hash = ? WHERE phone = '8431599907'", (new_hash,))
conn.commit()

# Also, passlib is broken on Python 3.13 + newer bcrypt. We need to patch security.py
with open("app/core/security.py", "r") as f:
    content = f.read()

new_content = """from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from app.core.config import settings

def verify_pin(plain_pin: str, hashed_pin: str): 
    try:
        return bcrypt.checkpw(plain_pin.encode('utf-8'), hashed_pin.encode('utf-8'))
    except ValueError:
        return False

def get_pin_hash(pin: str): 
    return bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
"""

with open("app/core/security.py", "w") as f:
    f.write(new_content)

print("Updated security.py and reset PIN to 1234")
