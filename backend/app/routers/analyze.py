import uuid
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.ml.inference import predict
from app.cloudinary_utils import upload_hoofprint_image
from app.db import get_supabase

router = APIRouter()


def _next_analysis_code() -> str:
    year = datetime.utcnow().year
    suffix = str(uuid.uuid4().int)[:4]
    return f"ANL-{year}-{suffix}"


@router.post("/analyze")
async def analyze_hoofprint(
    case_id: str = Form(...),
    evidence_id: str = Form(...),
    analyst_name: str = Form(...),
    collection_date: Optional[str] = Form(None),
    collection_location: Optional[str] = Form(None),
    evidence_notes: Optional[str] = Form(None),
    image: UploadFile = File(...),
):
    if image.content_type not in ("image/jpeg", "image/jpg", "image/png"):
        raise HTTPException(400, "Only JPG, JPEG, or PNG images are accepted.")

    file_bytes = await image.read()
    if len(file_bytes) == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    # Run inference off the event loop so health checks aren't blocked
    try:
        result = await run_in_threadpool(predict, file_bytes)
    except Exception as e:
        raise HTTPException(500, f"Model inference failed: {e}")

    # Upload the evidence image to Cloudinary
    try:
        upload = upload_hoofprint_image(file_bytes, image.filename or "hoofprint.jpg")
    except Exception as e:
        raise HTTPException(500, f"Image upload failed: {e}")

    parsed_date = None
    if collection_date:
        try:
            parsed_date = date.fromisoformat(collection_date)
        except ValueError:
            pass

    record = {
        "analysis_code": _next_analysis_code(),
        "case_id": case_id,
        "evidence_id": evidence_id,
        "analyst_name": analyst_name,
        "collection_date": parsed_date.isoformat() if parsed_date else None,
        "collection_location": collection_location,
        "evidence_notes": evidence_notes,
        "image_url": upload["url"],
        "image_public_id": upload["public_id"],
        "predicted_species": result["predicted_species"],
        "confidence": result["confidence"],
        "probability_distribution": result["probability_distribution"],
        "model_version": result["model_version"],
        "secondary_model_prediction": result["secondary_model_prediction"],
        "secondary_model_confidence": result["secondary_model_confidence"],
        "status": "pending_review",
    }

    supabase = get_supabase()
    inserted = supabase.table("analyses").insert(record).execute()

    if not inserted.data:
        raise HTTPException(500, "Failed to save analysis record.")

    return inserted.data[0]