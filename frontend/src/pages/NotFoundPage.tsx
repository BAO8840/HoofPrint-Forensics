import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import PageHero from "../components/PageHero";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <>
      <PageHero eyebrow="Error 404" title="Page not found">
        The page you opened does not exist or has moved.
      </PageHero>
      <div className="wrap">
        <div className="actions" style={{ marginTop: 0 }}>
          <Link to="/analyse" className="btn auto">
            Start an analysis
          </Link>
          <Link to="/records" className="btn auto ghost">
            View records
          </Link>
        </div>
      </div>
    </>
  );
}
