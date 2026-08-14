const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export interface AnalysisRecord {
  id: string;
  analysis_code: string;
  case_id: string;
  evidence_id: string;
  analyst_name: string;
  collection_date: string | null;
  collection_location: string | null;
  evidence_notes: string | null;
  image_url: string;
  predicted_species: "Cow" | "Goat" | "Sheep";
  confidence: number;
  probability_distribution: Record<string, number>;
  model_version: string;
  secondary_model_prediction: string | null;
  secondary_model_confidence: number | null;
  status: "pending_review" | "verified" | "inconclusive";
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface RecordsSummary {
  total: number;
  verified: number;
  pending_review: number;
  inconclusive: number;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function analyzeHoofprint(formData: FormData): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: formData });
  return handle<AnalysisRecord>(res);
}

export async function fetchRecords(params: {
  search?: string;
  species?: string;
  status?: string;
}): Promise<{ records: AnalysisRecord[]; summary: RecordsSummary }> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.species) qs.set("species", params.species);
  if (params.status) qs.set("status", params.status);
  const res = await fetch(`${API_BASE}/records?${qs.toString()}`);
  return handle(res);
}

export async function fetchRecord(id: string): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/records/${id}`);
  return handle<AnalysisRecord>(res);
}

export async function verifyRecord(
  id: string,
  status: "verified" | "inconclusive",
  verified_by: string
): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/records/${id}/verify`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, verified_by }),
  });
  return handle<AnalysisRecord>(res);
}

export function reportUrl(id: string): string {
  return `${API_BASE}/records/${id}/report`;
}
