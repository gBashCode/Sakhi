from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_pin_hash
import uuid

db = SessionLocal()
if not db.query(User).filter(User.phone == "9999999999").first():
    asha = User(id=uuid.uuid4(), phone="9999999999", pin_hash=get_pin_hash("1234"), name="Test ASHA", role="ASHA")
    db.add(asha)
    db.commit()
print("Seeded ASHA: 9999999999 / 1234")
