from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sakhi AI Backend")

from app.db.session import engine, Base
import app.models.user
import app.models.patient
import app.models.visit
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}

from app.api.v1.endpoints import auth, sync, dashboard
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sync.router, prefix="/api/v1", tags=["sync"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
