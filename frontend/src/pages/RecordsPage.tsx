import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchRecords } from "../lib/api";
import { formatDate } from "../lib/format";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import PageHero from "../components/PageHero";
import ConfidenceMeter from "../components/ConfidenceMeter";
import StatusPill from "../components/StatusPill";

const EMPTY_SUMMARY = { total: 0, verified: 0, pending_review: 0, inconclusive: 0 };

const REPORT_SECTIONS = [
  ["1. Case information", "Case ID, evidence ID, analyst and collection details"],
  ["2. Evidence", "Hoofprint image and collection notes"],
  ["3. Methodology", "Preprocessing procedure and model description"],
  ["4. Classification result", "Predicted species, confidence and probability distribution"],
  ["5. Analyst verification", "Status, analyst name and date"],
  ["6. Interpretation", "Cautious, evidence-based reading of the result"],
] as const;

export default function RecordsPage() {
  useDocumentTitle("Records");
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["records", debouncedSearch, species, status],
    queryFn: ({ signal }) =>
      fetchRecords({ search: debouncedSearch, species, status }, signal),
    placeholderData: keepPreviousData, // keep the table on screen while a new filter loads
  });

  const records = data?.records ?? [];
  const summary = data?.summary ?? EMPTY_SUMMARY;

  const stats: [string, number][] = [
    ["Total analyses", summary.total],
    ["Verified", summary.verified],
    ["Pending review", summary.pending_review],
    ["Inconclusive", summary.inconclusive],
  ];

  return (
    <>
      <PageHero eyebrow="Records and reports" title="Analysis records">
        Review earlier analyses, filter by species or review status, and open any record to
        generate its report.
      </PageHero>

      <div className="wrap">
        <div className="stats">
          {stats.map(([label, value]) => (
            <div className="stat" key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>

        <section className="card" aria-labelledby="history-title">
          <h2 id="history-title">Analysis history</h2>

          <div className="filters">
            <div>
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="search"
                placeholder="Analysis ID, case ID or analyst"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="species">Species</label>
              <select id="species" value={species} onChange={(e) => setSpecies(e.target.value)}>
                <option value="">All species</option>
                <option value="Cow">Cow</option>
                <option value="Sheep">Sheep</option>
                <option value="Goat">Goat</option>
              </select>
            </div>
            <div>
              <label htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="verified">Verified</option>
                <option value="pending_review">Pending review</option>
                <option value="inconclusive">Inconclusive</option>
              </select>
            </div>
          </div>

          {isError ? (
            <div className="alert" role="alert">
              <b>The records could not be loaded.</b> Check your connection and try again.
              <div className="actions" style={{ marginTop: 12 }}>
                <button type="button" className="btn auto ghost small" onClick={() => refetch()}>
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="scroll" aria-busy={isFetching}>
                <table>
                  <caption className="sr-only">Analysis history</caption>
                  <thead>
                    <tr>
                      <th scope="col">Analysis ID</th>
                      <th scope="col">Case ID</th>
                      <th scope="col">Species</th>
                      <th scope="col">Confidence</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="empty">
                          Loading records&hellip;
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty">
                          No records match your search.
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <b>{record.analysis_code}</b>
                          </td>
                          <td>{record.case_id}</td>
                          <td>{record.predicted_species}</td>
                          <td>
                            <ConfidenceMeter value={record.confidence} />
                          </td>
                          <td>{formatDate(record.created_at)}</td>
                          <td>
                            <StatusPill status={record.status} />
                          </td>
                          <td>
                            <Link
                              to={`/results/${record.id}`}
                              aria-label={`View record ${record.analysis_code}`}
                            >
                              View &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading && (
                <p className="hint" aria-live="polite">
                  {records.length} {records.length === 1 ? "record" : "records"} found
                </p>
              )}
            </>
          )}
        </section>

        <section className="card" aria-labelledby="reports-title">
          <h2 id="reports-title">Forensic reports</h2>
          <p style={{ margin: 0 }}>
            Open an analysis record, then choose <b>Generate report</b> to produce a formatted PDF
            report. Each report contains:
          </p>
          <ul className="reports">
            {REPORT_SECTIONS.map(([title, description]) => (
              <li key={title}>
                <b>{title}</b>
                <span>{description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
