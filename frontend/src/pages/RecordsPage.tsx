import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchRecords, reportUrl } from "../lib/api";

const statusStyles: Record<string, string> = {
  pending_review: "bg-gold-light text-gold",
  verified: "bg-green-100 text-green-700",
  inconclusive: "bg-gray-200 text-gray-600",
};

const statusLabels: Record<string, string> = {
  pending_review: "Pending Review",
  verified: "Verified",
  inconclusive: "Inconclusive",
};

export default function RecordsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("all");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["records", search, species, status],
    queryFn: () => fetchRecords({ search, species, status }),
  });

  const records = data?.records ?? [];
  const summary = data?.summary ?? { total: 0, verified: 0, pending_review: 0, inconclusive: 0 };

  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gold font-medium mb-1">
        Records &amp; Reports
      </div>
      <h1 className="font-serif text-3xl text-navy mb-6">Analysis Records</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Analyses" value={summary.total} />
        <StatCard label="Verified" value={summary.verified} accent="text-green-700" />
        <StatCard label="Pending Review" value={summary.pending_review} accent="text-gold" />
        <StatCard label="Inconclusive" value={summary.inconclusive} accent="text-gray-500" />
      </div>

      <div className="bg-white border border-parchment-border rounded p-6 mb-8">
        <h2 className="font-serif text-lg text-navy mb-4">A. Analysis History</h2>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="input flex-1 min-w-[220px]"
            placeholder="Search by Analysis ID, Case ID, or analyst&hellip;"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input w-auto" value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="all">All Species</option>
            <option value="Cow">Cow</option>
            <option value="Goat">Goat</option>
            <option value="Sheep">Sheep</option>
          </select>
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
        </div>

        {isLoading && <div className="text-center py-8 text-gray-400 text-sm">Loading records&hellip;</div>}
        {isError && <div className="text-center py-8 text-red-600 text-sm">Could not load records.</div>}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-parchment-border">
                  <th className="py-2 pr-3">Analysis ID</th>
                  <th className="py-2 pr-3">Case ID</th>
                  <th className="py-2 pr-3">Species</th>
                  <th className="py-2 pr-3">Confidence</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-parchment-border/60 hover:bg-parchment/60">
                    <td className="py-2.5 pr-3 text-navy font-medium">{r.analysis_code}</td>
                    <td className="py-2.5 pr-3 text-gray-600">{r.case_id}</td>
                    <td className="py-2.5 pr-3 font-medium">{r.predicted_species}</td>
                    <td className="py-2.5 pr-3">{r.confidence}%</td>
                    <td className="py-2.5 pr-3 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[r.status]}`}>
                        {statusLabels[r.status]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <button
                        onClick={() => navigate(`/results/${r.id}`)}
                        className="text-navy text-xs font-medium hover:underline"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No records found.</div>
            )}
            <div className="text-xs text-gray-400 mt-3">{records.length} records found</div>
          </div>
        )}
      </div>

      <div className="bg-white border border-parchment-border rounded p-6">
        <h2 className="font-serif text-lg text-navy mb-2">B. Forensic Reports</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select any analysis record above and click <strong>View &rarr;</strong>, then choose{" "}
          <strong>Generate Report</strong> from the result page to produce a formatted forensic
          report (PDF) for that analysis.
        </p>

        <div className="text-xs uppercase text-gray-400 mb-2">Report Contents</div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <ReportContentItem n="01" title="Case Information" desc="Case ID, Evidence ID, Analyst, Collection details" />
          <ReportContentItem n="02" title="Evidence" desc="Hoofprint image and collection notes" />
          <ReportContentItem n="03" title="Methodology" desc="Preprocessing procedure and model description" />
          <ReportContentItem n="04" title="Classification Result" desc="Predicted species, confidence, probability distribution" />
          <ReportContentItem n="05" title="Analyst Verification" desc="Verification status, analyst name, date" />
          <ReportContentItem n="06" title="Interpretation" desc="Scientifically cautious result interpretation" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-parchment-border rounded p-4">
      <div className="text-xs uppercase text-gray-400 mb-1">{label}</div>
      <div className={`font-serif text-2xl ${accent || "text-navy"}`}>{value}</div>
    </div>
  );
}

function ReportContentItem({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div>
      <div className="text-gold text-xs font-medium mb-0.5">{n} &middot; {title}</div>
      <div className="text-gray-500 text-xs">{desc}</div>
    </div>
  );
}
