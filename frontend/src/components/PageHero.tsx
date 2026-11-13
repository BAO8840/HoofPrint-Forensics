import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}

export default function PageHero({ eyebrow, title, children }: Props) {
  return (
    <div className="hero">
      <div className="in">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children && <p className="lead">{children}</p>}
      </div>
    </div>
  );
}
