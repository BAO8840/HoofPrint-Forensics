import { Link, NavLink } from "react-router-dom";

const LINKS = [
  { to: "/analyse", label: "Analyse" },
  { to: "/records", label: "Records" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="bar">
        <Link className="brand" to="/analyse">
          <img className="logo" src="/aatu-logo.png" alt="" width={106} height={48} />
          <span>
            <b>HoofPrint Forensics</b>
            <small>Abiola Ajimobi Technical University, Ibadan</small>
          </span>
        </Link>
        <nav aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
