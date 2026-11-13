import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeHoofprint } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import PageHero from "../components/PageHero";
import AnalysisProgress from "../components/AnalysisProgress";
import { CameraIcon } from "../components/icons";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_EXTENSION = /\.(jpe?g|png)$/i;
// Matches the image size limit of the free Cloudinary plan the backend uploads to.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const EMPTY_FORM = {
  case_id: "",
  evidence_id: "",
  analyst_name: "",
  collection_date: "",
  collection_location: "",
  evidence_notes: "",
};
type FormState = typeof EMPTY_FORM;

function validateImage(file: File): string | null {
  const typeOk = ACCEPTED_TYPES.includes(file.type) || (!file.type && ACCEPTED_EXTENSION.test(file.name));
  if (!typeOk) return "This file is not supported. Choose a JPG or PNG image.";
  if (file.size === 0) return "This file is empty. Choose a different image.";
  if (file.size > MAX_IMAGE_BYTES) return "This image is larger than 10 MB. Choose a smaller photo.";
  return null;
}

export default function AnalysePage() {
  useDocumentTitle("Analyse");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Create the preview from the file and release it when the file changes or the page closes.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: analyzeHoofprint,
    onSuccess: (record) => {
      // The records list is cached, so mark it stale to show the new analysis straight away.
      queryClient.invalidateQueries({ queryKey: ["records"] });
      navigate(`/results/${record.id}`);
    },
  });

  const setField =
    (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  function selectFile(next: File | null) {
    if (!next) return;
    const problem = validateImage(next);
    setFileError(problem);
    if (!problem) setFile(next);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    selectFile(e.target.files?.[0] ?? null);
    e.target.value = ""; // lets the same file be chosen again after removing it
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files?.[0] ?? null);
  }

  function removeImage() {
    setFile(null);
    setFileError(null);
  }

  const canSubmit = Boolean(
    form.case_id.trim() && form.evidence_id.trim() && form.analyst_name.trim() && file
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file || mutation.isPending) return;

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (trimmed) data.append(key, trimmed);
    });
    data.append("image", file);
    mutation.mutate(data);
  }

  return (
    <>
      <PageHero eyebrow="Analysis" title="Forensic hoofprint analysis">
        Upload a photograph of a hoofprint to identify the livestock species (cattle, sheep or
        goat) with the trained classification model.
      </PageHero>

      <div className="wrap">
        <ol className="steps" aria-label="Workflow">
          <li>
            <b>1</b>Enter evidence details
          </li>
          <li>
            <b>2</b>Upload image
          </li>
          <li>
            <b>3</b>Review result
          </li>
        </ol>

        {mutation.isError && (
          <div className="alert" role="alert">
            <b>The analysis did not complete.</b> {mutation.error.message}
          </div>
        )}

        {mutation.isPending ? (
          <AnalysisProgress />
        ) : (
          <form className="grid" onSubmit={handleSubmit}>
            <div className="card">
              <h2>Evidence details</h2>

              <label htmlFor="case_id">
                Case ID <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="case_id"
                placeholder="e.g. AATU-2026-018"
                value={form.case_id}
                onChange={setField("case_id")}
                required
              />

              <label htmlFor="evidence_id">
                Evidence ID <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="evidence_id"
                placeholder="e.g. EV-0042"
                value={form.evidence_id}
                onChange={setField("evidence_id")}
                required
              />

              <label htmlFor="analyst_name">
                Analyst name <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="analyst_name"
                placeholder="Full name"
                autoComplete="name"
                value={form.analyst_name}
                onChange={setField("analyst_name")}
                required
              />

              <label htmlFor="collection_date">Collection date</label>
              <input
                id="collection_date"
                type="date"
                value={form.collection_date}
                onChange={setField("collection_date")}
              />

              <label htmlFor="collection_location">Collection location</label>
              <input
                id="collection_location"
                placeholder="e.g. Ogbomoso North, Oyo State"
                value={form.collection_location}
                onChange={setField("collection_location")}
              />

              <label htmlFor="evidence_notes">Evidence notes</label>
              <textarea
                id="evidence_notes"
                placeholder="Record the collection conditions, print quality and any other relevant observations."
                value={form.evidence_notes}
                onChange={setField("evidence_notes")}
              />
              <p className="hint">
                <span className="req" aria-hidden="true">*</span> Required
              </p>
            </div>

            <div>
              <div className="card">
                <h2>Hoofprint image</h2>

                <label
                  className={`drop${dragging ? " over" : ""}`}
                  htmlFor="image"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <CameraIcon />
                  <strong>{file ? file.name : "Upload hoofprint image"}</strong>
                  <span>{file ? "Select to replace the image" : "Drag and drop, or select a file"}</span>
                  <span className="hint" style={{ display: "block" }}>
                    Accepted formats: JPG, JPEG, PNG, up to 10 MB. On a phone you can take a photo or
                    choose one from your library.
                  </span>
                  <input
                    id="image"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleInputChange}
                  />
                </label>

                {fileError && (
                  <p className="field-error" role="alert">
                    {fileError}
                  </p>
                )}

                {previewUrl && (
                  <>
                    <img className="preview" src={previewUrl} alt="Preview of the selected hoofprint" />
                    <div className="actions" style={{ justifyContent: "center" }}>
                      <button type="button" className="btn auto ghost small" onClick={removeImage}>
                        Remove image
                      </button>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn"
                  disabled={!canSubmit}
                  aria-describedby={canSubmit ? undefined : "why-disabled"}
                >
                  Analyse hoofprint
                </button>
                {!canSubmit && (
                  <p className="hint" id="why-disabled" style={{ marginTop: 8 }}>
                    Complete the required fields and add an image to continue.
                  </p>
                )}
                <p className="note">
                  Machine-learning classification supports, but does not replace, expert judgement.
                  A qualified analyst must review every result before a formal conclusion is drawn.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
