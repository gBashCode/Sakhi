from app.db.session import SessionLocal
from app.models.visit import Visit

db = SessionLocal()
deleted = db.query(Visit).delete()
db.commit()
print(f"Successfully deleted {deleted} visits. Database is ready for the next practice run!")
