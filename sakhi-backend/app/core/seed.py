from app.db.firebase import get_db
from app.core.security import get_pin_hash
import uuid

db = get_db()
users_ref = db.collection("users")

query = users_ref.where("phone", "==", "9999999999").limit(1).stream()
existing = list(query)

if not existing:
    new_id = str(uuid.uuid4())
    users_ref.document(new_id).set({
        "phone": "9999999999",
        "pin_hash": get_pin_hash("1234"),
        "name": "Test ASHA",
        "role": "ASHA"
    })
    print("Seeded ASHA: 9999999999 / 1234")
else:
    print("ASHA already exists")
