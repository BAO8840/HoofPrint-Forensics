import type { AnalysisStatus } from "./api";

/** Results below this confidence are flagged for closer review. */
export const LOW_CONFIDENCE_THRESHOLD = 60;

export const STATUS_LABEL: Record<AnalysisStatus, string> = {
  pending_review: "Pending review",
  verified: "Verified",
  inconclusive: "Inconclusive",
};

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** dd/mm/yyyy. Date-only strings (YYYY-MM-DD) are read as UTC so they never shift a day. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString("en-GB", {
    timeZone: iso.length === 10 ? "UTC" : undefined,
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}
