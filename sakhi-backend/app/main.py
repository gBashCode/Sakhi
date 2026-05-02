from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sakhi AI Backend")

from app.db.session import engine, Base
from app.models.user import User
from app.models.patient import Patient
from app.models.visit import Visit
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.responses import RedirectResponse

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "ok"}

from app.api.v1.endpoints import auth, sync, dashboard, visits
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sync.router, prefix="/api/v1", tags=["sync"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(visits.router, prefix="/api/v1", tags=["visits"])
