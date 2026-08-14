import { NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
    isActive ? "bg-navy/10 text-navy" : "text-gray-600 hover:text-navy"
  }`;

export default function Navbar() {
  return (
    <header className="border-b border-parchment-border bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-navy text-xl">&#128062;</span>
          <span className="font-serif font-semibold text-navy text-lg">
            HoofPrint Forensics
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink to="/analyse" className={navLinkClass}>
            Analyse
          </NavLink>
          <NavLink to="/records" className={navLinkClass}>
            Records
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <span className="mx-2 h-5 w-px bg-parchment-border" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-6 h-6 rounded-full bg-navy/10 text-navy flex items-center justify-center text-xs font-semibold">
              OM
            </span>
            Analyst
          </div>
        </nav>
      </div>
    </header>
  );
}
