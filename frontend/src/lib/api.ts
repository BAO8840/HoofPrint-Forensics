const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(
  /\/+$/,
  ""
);

export type Species = "Cow" | "Goat" | "Sheep";
export type AnalysisStatus = "pending_review" | "verified" | "inconclusive";

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
  predicted_species: Species;
  confidence: number;
  probability_distribution: Record<string, number>;
  model_version: string;
  secondary_model_prediction: string | null;
  secondary_model_confidence: number | null;
  status: AnalysisStatus;
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

export interface RecordsResponse {
  records: AnalysisRecord[];
  summary: RecordsSummary;
}

const NETWORK_ERROR = "Could not reach the analysis server. Check your connection and try again.";

/** FastAPI sends `detail` as a string for HTTP errors and as a list of {msg} for validation errors. */
function messageFromDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item ? String(item.msg) : null
      )
      .filter((m): m is string => Boolean(m));
    return messages.length ? messages.join("; ") : null;
  }
  return null;
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(NETWORK_ERROR);
  }
  return res;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await send(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(messageFromDetail(body?.detail) ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function analyzeHoofprint(formData: FormData): Promise<AnalysisRecord> {
  return request<AnalysisRecord>("/analyze", { method: "POST", body: formData });
}

export function fetchRecords(
  params: { search?: string; species?: string; status?: string },
  signal?: AbortSignal
): Promise<RecordsResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.species) qs.set("species", params.species);
  if (params.status) qs.set("status", params.status);
  const query = qs.toString();
  return request<RecordsResponse>(`/records${query ? `?${query}` : ""}`, { signal });
}

export function fetchRecord(id: string): Promise<AnalysisRecord> {
  return request<AnalysisRecord>(`/records/${encodeURIComponent(id)}`);
}

export function verifyRecord(
  id: string,
  status: "verified" | "inconclusive",
  verified_by: string
): Promise<AnalysisRecord> {
  return request<AnalysisRecord>(`/records/${encodeURIComponent(id)}/verify`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, verified_by }),
  });
}

/** Fetches the PDF report and hands it to the browser as a file download. */
export async function downloadReport(id: string, filename: string): Promise<void> {
  const res = await send(`/records/${encodeURIComponent(id)}/report`);
  if (!res.ok) throw new Error(`Report generation failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
