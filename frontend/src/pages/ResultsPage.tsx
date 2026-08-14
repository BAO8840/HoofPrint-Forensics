import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecord, verifyRecord, reportUrl } from "../lib/api";
import ProbabilityBar from "../components/ProbabilityBar";
import { useToast } from "../components/Toast";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [verifierName, setVerifierName] = useState("");
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const { data: record, isLoading, isError } = useQuery({
    queryKey: ["record", id],
    queryFn: () => fetchRecord(id!),
    enabled: !!id,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ status }: { status: "verified" | "inconclusive" }) =>
      verifyRecord(id!, status, verifierName || record?.analyst_name || "Analyst"),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["record", id] });
      showToast(
        "success",
        variables.status === "verified" ? "Result marked as verified" : "Result marked as inconclusive"
      );
    },
    onError: (err: Error) => showToast("error", err.message || "Could not update verification status"),
  });

  async function handleGenerateReport() {
    if (!record) return;
    setIsDownloadingReport(true);
    try {
      const res = await fetch(reportUrl(record.id));
      if (!res.ok) throw new Error(`Report generation failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${record.analysis_code}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", "Report downloaded");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Could not generate report");
    } finally {
      setIsDownloadingReport(false);
    }
  }

  if (isLoading) return <div className="text-center py-16 text-gray-500">Loading&hellip;</div>;
  if (isError || !record)
    return <div className="text-center py-16 text-red-600">Could not load this record.</div>;

  const sortedProbs = Object.entries(record.probability_distribution).sort(
    (a, b) => b[1] - a[1]
  );

  const statusLabel: Record<string, { text: string; className: string }> = {
    pending_review: { text: "Pending Review", className: "bg-gold-light text-gold" },
    verified: { text: "Verified", className: "bg-green-100 text-green-700" },
    inconclusive: { text: "Inconclusive", className: "bg-gray-200 text-gray-600" },
  };
  const status = statusLabel[record.status];

  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
        {record.analysis_code}
      </div>
      <h1 className="font-serif text-3xl text-navy mb-2">Analysis Complete</h1>
      <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium mb-6 ${status.className}`}>
        {status.text}
      </span>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-parchment-border rounded p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase text-gray-400">Model Prediction</span>
              <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded">
                {record.model_version}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Automated classification result &mdash; not a verified forensic determination.
            </p>

            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-xs uppercase text-gray-400 mb-1">Predicted Species</div>
                <div className="font-serif text-4xl text-navy">
                  {record.predicted_species.toUpperCase()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Confidence Score</div>
                <div className="text-2xl font-semibold text-gold">{record.confidence}%</div>
              </div>
            </div>

            <div className="h-2 rounded-full bg-gray-200 overflow-hidden my-4">
              <div className="h-full bg-navy rounded-full" style={{ width: `${record.confidence}%` }} />
            </div>

            <div className="text-xs uppercase text-gray-400 mb-2 mt-6">
              Probability Distribution
            </div>
            {sortedProbs.map(([species, prob], i) => (
              <ProbabilityBar key={species} species={species} probability={prob} isTop={i === 0} />
            ))}

            {record.secondary_model_prediction && (
              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-parchment-border">
                Cross-check (deep learning model): predicted{" "}
                <strong>{record.secondary_model_prediction}</strong> at{" "}
                {record.secondary_model_confidence}% confidence.
                {record.secondary_model_prediction !== record.predicted_species && (
                  <span className="text-red-600 font-medium"> Models disagree on this sample.</span>
                )}
              </p>
            )}
          </div>

          <div className="bg-white border border-parchment-border rounded p-6">
            <h2 className="font-serif text-lg text-navy mb-2">Interpretation</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Based on the submitted hoofprint image, the machine-learning model classified the
              specimen as <strong>{record.predicted_species}</strong> with a confidence score of{" "}
              <strong>{record.confidence}%</strong>. This output represents analytical evidence
              and requires appropriate human review and interpretation before any formal
              conclusion is drawn. The result should be considered alongside other physical and
              documentary evidence.
            </p>
          </div>

          <div className="bg-white border border-parchment-border rounded p-6">
            <div className="text-xs text-gray-400 mb-3">
              Model Prediction &rarr; Analyst Verification
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                className="input flex-1 min-w-[180px]"
                placeholder="Your name, to record the verification"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
              />
              <button
                onClick={() => verifyMutation.mutate({ status: "verified" })}
                disabled={verifyMutation.isPending}
                className="border border-navy text-navy px-4 py-2 rounded text-sm font-medium hover:bg-navy/5"
              >
                Verify Result
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={isDownloadingReport}
                className="bg-navy text-white px-4 py-2 rounded text-sm font-medium hover:bg-navy-dark disabled:opacity-60"
              >
                {isDownloadingReport ? "Generating…" : "Generate Report"}
              </button>
              <button
                onClick={() => navigate("/analyse")}
                className="text-gray-500 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100"
              >
                New Analysis
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-parchment-border rounded p-4">
            <div className="text-xs uppercase text-gray-400 mb-2">Evidence Image</div>
            <img src={record.image_url} alt="hoofprint evidence" className="w-full rounded" />
          </div>

          <div className="bg-white border border-parchment-border rounded p-4 text-sm space-y-2">
            <div className="text-xs uppercase text-gray-400 mb-1">Analysis Details</div>
            <DetailRow label="Analysis ID" value={record.analysis_code} />
            <DetailRow label="Case ID" value={record.case_id} />
            <DetailRow label="Evidence ID" value={record.evidence_id} />
            <DetailRow label="Analyst" value={record.analyst_name} />
            <DetailRow label="Date / Time" value={new Date(record.created_at).toLocaleString()} />
            <DetailRow label="Model" value={record.model_version} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-gray-400">{label}</div>
      <div className="text-navy font-medium">{value}</div>
    </div>
  );
}