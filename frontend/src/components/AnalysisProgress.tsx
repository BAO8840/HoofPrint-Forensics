// The request has no real progress events, so this shows an honest indeterminate
// state instead of a staged list that would imply steps we cannot observe.
export default function AnalysisProgress() {
  return (
    <div className="card progress-card" role="status" aria-live="polite">
      <h2>Analysing hoofprint</h2>
      <p style={{ margin: 0 }}>Uploading the image and running the classification model.</p>
      <div className="progress" aria-hidden="true">
        <i />
      </div>
      <p className="hint">
        The first analysis after a quiet period can take up to a minute while the server starts.
        Keep this page open.
      </p>
    </div>
  );
}
