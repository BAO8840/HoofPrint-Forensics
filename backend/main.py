import os
import re

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analyze, records


app = FastAPI(title="HoofPrint Forensics API")

allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://hoofprint-forensics.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://hoofprint-forensics.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(records.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}