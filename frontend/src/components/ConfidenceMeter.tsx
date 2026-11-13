import { LOW_CONFIDENCE_THRESHOLD, clampPercent, formatPercent } from "../lib/format";

export default function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="conf">
      <div className="track" aria-hidden="true">
        <div className="fill" style={{ width: `${clampPercent(value)}%` }} />
      </div>
      <span>{formatPercent(value)}</span>
      {value < LOW_CONFIDENCE_THRESHOLD && (
        <span className="low" title={`Below ${LOW_CONFIDENCE_THRESHOLD}% confidence`}>
          Low
        </span>
      )}
    </div>
  );
}
