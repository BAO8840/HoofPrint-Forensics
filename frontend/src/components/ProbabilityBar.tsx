interface Props {
  species: string;
  probability: number;
  isTop: boolean;
}

export default function ProbabilityBar({ species, probability, isTop }: Props) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className={isTop ? "font-semibold text-navy" : "text-gray-600"}>
          {species} {isTop && <span className="text-gold">&uarr; top</span>}
        </span>
        <span className={isTop ? "font-semibold text-navy" : "text-gray-600"}>
          {probability}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${isTop ? "bg-navy" : "bg-gray-400"}`}
          style={{ width: `${probability}%` }}
        />
      </div>
    </div>
  );
}
