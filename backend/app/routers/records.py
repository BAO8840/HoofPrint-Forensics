from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.db import get_supabase
from app.schemas import VerifyRequest
from app.report import generate_report_pdf

router = APIRouter()


@router.get("/records")
def list_records(
    search: Optional[str] = Query(None),
    species: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    supabase = get_supabase()
    query = supabase.table("analyses").select("*").order("created_at", desc=True)

    if species and species != "all":
        query = query.eq("predicted_species", species)
    if status and status != "all":
        query = query.eq("status", status)

    result = query.execute()
    rows = result.data or []

    if search:
        s = search.lower()
        rows = [
            r for r in rows
            if s in r["analysis_code"].lower()
            or s in r["case_id"].lower()
            or s in r["analyst_name"].lower()
        ]

    summary = {
        "total": len(rows),
        "verified": sum(1 for r in rows if r["status"] == "verified"),
        "pending_review": sum(1 for r in rows if r["status"] == "pending_review"),
        "inconclusive": sum(1 for r in rows if r["status"] == "inconclusive"),
    }

    return {"records": rows, "summary": summary}


@router.get("/records/{record_id}")
def get_record(record_id: str):
    supabase = get_supabase()
    result = supabase.table("analyses").select("*").eq("id", record_id).execute()
    if not result.data:
        raise HTTPException(404, "Record not found.")
    return result.data[0]


@router.patch("/records/{record_id}/verify")
def verify_record(record_id: str, body: VerifyRequest):
    if body.status not in ("verified", "inconclusive"):
        raise HTTPException(400, "status must be 'verified' or 'inconclusive'.")

    supabase = get_supabase()
    update = {
        "status": body.status,
        "verified_by": body.verified_by,
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }
    result = supabase.table("analyses").update(update).eq("id", record_id).execute()
    if not result.data:
        raise HTTPException(404, "Record not found.")
    return result.data[0]


@router.get("/records/{record_id}/report")
def download_report(record_id: str):
    supabase = get_supabase()
    result = supabase.table("analyses").select("*").eq("id", record_id).execute()
    if not result.data:
        raise HTTPException(404, "Record not found.")

    record = result.data[0]
    pdf_bytes = generate_report_pdf(record)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{record["analysis_code"]}_report.pdf"'
        },
    )
