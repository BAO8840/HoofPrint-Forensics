import { clampPercent, formatPercent } from "../lib/format";

interface Props {
  species: string;
  probability: number;
  isTop: boolean;
}

export default function ProbabilityBar({ species, probability, isTop }: Props) {
  return (
    <div className={`bar-row${isTop ? " top" : ""}`}>
      <span>{species}</span>
      <div className="track" aria-hidden="true">
        <div className="fill" style={{ width: `${clampPercent(probability)}%` }} />
      </div>
      <b>{formatPercent(probability)}</b>
    </div>
  );
}
