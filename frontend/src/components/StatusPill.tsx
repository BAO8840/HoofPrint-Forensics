import type { AnalysisStatus } from "../lib/api";
import { STATUS_LABEL } from "../lib/format";

const CLASS: Record<AnalysisStatus, string> = {
  verified: "v",
  pending_review: "p",
  inconclusive: "i",
};

export default function StatusPill({ status }: { status: AnalysisStatus }) {
  return <span className={`pill ${CLASS[status] ?? "p"}`}>{STATUS_LABEL[status] ?? status}</span>;
}
