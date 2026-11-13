import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { downloadReport, fetchRecord, verifyRecord } from "../lib/api";
import {
  LOW_CONFIDENCE_THRESHOLD,
  STATUS_LABEL,
  formatDate,
  formatDateTime,
  formatPercent,
} from "../lib/format";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useToast } from "../components/Toast";
import PageHero from "../components/PageHero";
import ProbabilityBar from "../components/ProbabilityBar";
import StatusPill from "../components/StatusPill";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [verifier, setVerifier] = useState("");
  const [downloading, setDownloading] = useState(false);

  const {
    data: record,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["record", id],
    queryFn: () => fetchRecord(id!),
    enabled: Boolean(id),
  });

  useDocumentTitle(record ? `Result ${record.analysis_code}` : "Result");

  const verifyMutation = useMutation({
    mutationFn: (status: "verified" | "inconclusive") => verifyRecord(id!, status, verifier.trim()),
    onSuccess: (updated, status) => {
      queryClient.setQueryData(["record", id], updated);
      queryClient.invalidateQueries({ queryKey: ["records"] });
      showToast(
        "success",
        status === "verified" ? "Result marked as verified." : "Result marked as inconclusive."
      );
    },
    onError: (err: Error) =>
      showToast("error", err.message || "Could not update the verification status."),
  });

  async function handleGenerateReport() {
    if (!record) return;
    setDownloading(true);
    try {
      await downloadReport(record.id, `${record.analysis_code}_report.pdf`);
      showToast("success", "Report downloaded.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Could not generate the report.");
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHero eyebrow="Analysis result" title="Loading result" />
        <div className="wrap">
          <p className="empty" role="status">
            Loading the analysis record&hellip;
          </p>
        </div>
      </>
    );
  }

  if (isError || !record) {
    return (
      <>
        <PageHero eyebrow="Analysis result" title="Result unavailable" />
        <div className="wrap">
          <div className="alert" role="alert">
            <b>This record could not be loaded.</b>{" "}
            {error instanceof Error ? error.message : "Try again, or return to the records list."}
          </div>
          <div className="actions">
            <button type="button" className="btn auto" onClick={() => refetch()}>
              Try again
            </button>
            <Link to="/records" className="btn auto ghost">
              Back to records
            </Link>
          </div>
        </div>
      </>
    );
  }

  const probabilities = Object.entries(record.probability_distribution).sort((a, b) => b[1] - a[1]);
  const lowConfidence = record.confidence < LOW_CONFIDENCE_THRESHOLD;
  const hasCrossCheck = Boolean(record.secondary_model_prediction);
  const modelsDisagree =
    hasCrossCheck && record.secondary_model_prediction !== record.predicted_species;
  const canVerify = verifier.trim().length > 0 && !verifyMutation.isPending;
  const reviewed = record.status !== "pending_review";

  return (
    <>
      <PageHero eyebrow={record.analysis_code} title="Classification result">
        Automated classification result. It is not a verified forensic determination.
      </PageHero>

      <div className="wrap">
        <p className="status-line">
          <StatusPill status={record.status} />
          <span>Model {record.model_version}</span>
        </p>

        <div className="grid wide-left">
          <div className="stack">
            <section className="card" aria-labelledby="prediction-title">
              <h2 id="prediction-title">Model prediction</h2>
              <div className="result-head">
                <div>
                  <span className="kicker">Predicted species</span>
                  <div className="species">{record.predicted_species}</div>
                </div>
                <div className="score">
                  <span className="kicker">Confidence</span>
                  <b>{formatPercent(record.confidence)}</b>
                </div>
              </div>

              {lowConfidence && (
                <p className="note warn">
                  Confidence is below {LOW_CONFIDENCE_THRESHOLD}%. Check the image quality and
                  review this result closely before relying on it.
                </p>
              )}

              <h3 className="sub">Probability distribution</h3>
              {probabilities.map(([species, probability], index) => (
                <ProbabilityBar
                  key={species}
                  species={species}
                  probability={probability}
                  isTop={index === 0}
                />
              ))}

              {hasCrossCheck && (
                <p className="note">
                  Cross-check (deep-learning model): predicted{" "}
                  <b>{record.secondary_model_prediction}</b>
                  {record.secondary_model_confidence != null &&
                    ` at ${formatPercent(record.secondary_model_confidence)} confidence`}
                  .{" "}
                  {modelsDisagree && <b className="bad">The models disagree on this sample.</b>}
                </p>
              )}
            </section>

            <section className="card" aria-labelledby="interpretation-title">
              <h2 id="interpretation-title">Interpretation</h2>
              <p style={{ margin: 0 }}>
                Based on the submitted hoofprint image, the machine-learning model classified the
                specimen as <b>{record.predicted_species}</b> with a confidence score of{" "}
                <b>{formatPercent(record.confidence)}</b>. This output is analytical evidence and
                needs human review and interpretation before any formal conclusion is drawn. Weigh
                it alongside the other physical and documentary evidence in the case.
              </p>
            </section>

            <section className="card" aria-labelledby="verification-title">
              <h2 id="verification-title">Analyst verification</h2>
              {reviewed && (
                <p style={{ margin: "0 0 4px" }}>
                  Marked <b>{STATUS_LABEL[record.status].toLowerCase()}</b>
                  {record.verified_by && <> by {record.verified_by}</>}
                  {record.verified_at && <> on {formatDateTime(record.verified_at)}</>}.
                </p>
              )}
              <label htmlFor="verifier">Verifying analyst</label>
              <input
                id="verifier"
                autoComplete="name"
                placeholder="Full name"
                value={verifier}
                onChange={(e) => setVerifier(e.target.value)}
              />
              <p className="hint">Your name is recorded with the verification.</p>
              <div className="actions">
                <button
                  type="button"
                  className="btn auto"
                  disabled={!canVerify}
                  onClick={() => verifyMutation.mutate("verified")}
                >
                  Verify result
                </button>
                <button
                  type="button"
                  className="btn auto ghost"
                  disabled={!canVerify}
                  onClick={() => verifyMutation.mutate("inconclusive")}
                >
                  Mark inconclusive
                </button>
              </div>
            </section>

            <section className="card no-print" aria-labelledby="report-title">
              <h2 id="report-title">Report</h2>
              <p style={{ margin: 0 }}>
                Download a formatted PDF report with the case information, evidence, method, result,
                verification and interpretation.
              </p>
              <div className="actions">
                <button
                  type="button"
                  className="btn auto"
                  onClick={handleGenerateReport}
                  disabled={downloading}
                >
                  {downloading ? "Generating report\u2026" : "Generate report"}
                </button>
                <Link to="/analyse" className="btn auto ghost">
                  New analysis
                </Link>
              </div>
            </section>
          </div>

          <div className="stack">
            <section className="card" aria-labelledby="evidence-title">
              <h2 id="evidence-title">Evidence image</h2>
              <img
                className="evidence"
                src={record.image_url}
                alt={`Hoofprint photograph for case ${record.case_id}`}
              />
            </section>

            <section className="card" aria-labelledby="details-title">
              <h2 id="details-title">Analysis details</h2>
              <dl className="stacked">
                <dt>Analysis ID</dt>
                <dd>{record.analysis_code}</dd>
                <dt>Case ID</dt>
                <dd>{record.case_id}</dd>
                <dt>Evidence ID</dt>
                <dd>{record.evidence_id}</dd>
                <dt>Analyst</dt>
                <dd>{record.analyst_name}</dd>
                <dt>Analysed</dt>
                <dd>{formatDateTime(record.created_at)}</dd>
                {record.collection_date && (
                  <>
                    <dt>Collected</dt>
                    <dd>{formatDate(record.collection_date)}</dd>
                  </>
                )}
                {record.collection_location && (
                  <>
                    <dt>Location</dt>
                    <dd>{record.collection_location}</dd>
                  </>
                )}
                {record.evidence_notes && (
                  <>
                    <dt>Evidence notes</dt>
                    <dd>{record.evidence_notes}</dd>
                  </>
                )}
              </dl>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
