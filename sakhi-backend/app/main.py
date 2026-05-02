from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import io

app = FastAPI(
    title="Sakhi AI Backend",
    description="Voice-first healthcare backend for ASHA workers",
    version="1.0.0",
)

from app.db.session import engine, Base
from app.models.user import User
from app.models.patient import Patient
from app.models.visit import Visit
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your Lovable URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import RedirectResponse

# Load model once on server start. GPU if available.
print("Loading Whisper on server...")
try:
    from transformers import pipeline
    stt = pipeline(
        "automatic-speech-recognition",
        model="openai/whisper-small", 
        device=0 if torch.cuda.is_available() else -1 
    )
    print("Server model ready ✅")
except ImportError:
    print("Warning: transformers/torch not installed, server STT will fail.")
    stt = None

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0", "model": "whisper-small"}

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not stt:
        return {"error": "Server STT not configured"}
    audio_bytes = await file.read()

    # Run inference
    result = stt(audio_bytes, generate_kwargs={"language": "hindi", "task": "transcribe"})
    return {"text": result["text"], "source": "server"}

# ── Routers ──────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import auth, sync, dashboard, visits, patients, copilot

app.include_router(auth.router,      prefix="/api/v1/auth",     tags=["auth"])
app.include_router(sync.router,      prefix="/api/v1",          tags=["sync"])
app.include_router(dashboard.router, prefix="/api/v1",          tags=["dashboard"])
app.include_router(visits.router,    prefix="/api/v1",          tags=["visits"])
app.include_router(patients.router,  prefix="/api/v1",          tags=["patients"])
app.include_router(copilot.router,   prefix="/api/v1/copilot",  tags=["copilot"])
