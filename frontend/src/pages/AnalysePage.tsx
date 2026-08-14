import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { analyzeHoofprint } from "../lib/api";
import StepLoader from "../components/StepLoader";

export default function AnalysePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    case_id: "",
    evidence_id: "",
    analyst_name: "",
    collection_date: "",
    collection_location: "",
    evidence_notes: "",
  });

  const mutation = useMutation({
    mutationFn: analyzeHoofprint,
    onSuccess: (record) => navigate(`/results/${record.id}`),
  });

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("image", selectedFile);
    mutation.mutate(data);
  }

  const isFormValid = form.case_id && form.evidence_id && form.analyst_name && selectedFile;

  if (mutation.isPending) {
    return <StepLoader />;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-gold font-medium mb-1">
          Analysis Interface
        </div>
        <h1 className="font-serif text-3xl text-navy mb-2">Forensic Hoofprint Analysis</h1>
        <p className="text-gray-600 max-w-2xl text-sm">
          Upload a hoofprint image to classify the livestock species using the trained
          machine-learning model.
        </p>
      </div>

      {mutation.isError && (
        <div className="mb-4 px-4 py-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-parchment-border rounded p-6">
          <h2 className="font-serif text-lg text-navy mb-4 pb-2 border-b border-parchment-border">
            Evidence Information
          </h2>

          <Field label="Case ID" required>
            <input
              className="input"
              placeholder="e.g. AATU-2024-018"
              value={form.case_id}
              onChange={(e) => setForm({ ...form, case_id: e.target.value })}
              required
            />
          </Field>

          <Field label="Evidence ID" required>
            <input
              className="input"
              placeholder="e.g. EV-0042"
              value={form.evidence_id}
              onChange={(e) => setForm({ ...form, evidence_id: e.target.value })}
              required
            />
          </Field>

          <Field label="Analyst Name" required>
            <input
              className="input"
              placeholder="Full name"
              value={form.analyst_name}
              onChange={(e) => setForm({ ...form, analyst_name: e.target.value })}
              required
            />
          </Field>

          <Field label="Collection Date">
            <input
              type="date"
              className="input"
              value={form.collection_date}
              onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
            />
          </Field>

          <Field label="Collection Location">
            <input
              className="input"
              placeholder="e.g. Ogbomoso North, Oyo State"
              value={form.collection_location}
              onChange={(e) => setForm({ ...form, collection_location: e.target.value })}
            />
          </Field>

          <Field label="Evidence Notes">
            <textarea
              className="input min-h-[80px]"
              placeholder="Describe collection conditions, print quality, or other relevant observations."
              value={form.evidence_notes}
              onChange={(e) => setForm({ ...form, evidence_notes: e.target.value })}
            />
          </Field>
        </div>

        <div>
          <div className="bg-white border border-parchment-border rounded p-6 mb-4">
            <h2 className="font-serif text-lg text-navy mb-4 pb-2 border-b border-parchment-border">
              Hoofprint Image
            </h2>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileChange(file);
              }}
              className="border-2 border-dashed border-parchment-border rounded-lg p-8 text-center cursor-pointer hover:border-navy/40 transition-colors"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="max-h-48 mx-auto rounded" />
              ) : (
                <>
                  <div className="text-3xl mb-2">&#128247;</div>
                  <div className="text-navy font-medium text-sm">Upload Hoofprint Image</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Drag and drop, or click to browse
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Accepted formats: JPG, JPEG, PNG
                  </div>
                  <div className="text-xs text-gray-400">Mobile camera capture supported</div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="bg-white border border-parchment-border rounded p-6">
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-navy text-white rounded py-2.5 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy-dark transition-colors"
            >
              Analyse Hoofprint
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Machine-learning classification is analytical decision-support information and
              should be reviewed by an appropriate analyst before any formal conclusion is drawn.
            </p>
            <p className="text-xs text-gray-400 mt-2">* Required fields</p>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
