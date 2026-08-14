import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ml.inference import load_models
from app.routers import analyze, records


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load both models once at startup, not per-request — loading ResNet50 +
    # EfficientNetB0 on every /analyze call would be extremely slow.
    load_models()
    yield


app = FastAPI(title="HoofPrint Forensics API", lifespan=lifespan)

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(records.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
