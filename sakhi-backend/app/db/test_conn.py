from app.db.session import engine

with engine.connect() as conn:
    print("DB Connected")
