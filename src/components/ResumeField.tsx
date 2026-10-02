import { useId, useState } from "react";
import type { ResumeDraft, ResumeMode } from "../hooks/useResume";
import type { PdfResume } from "../types/resume";
import { readResumeFile } from "../utils/readResumeFile";
import type { FieldStatus } from "../utils/validateInputs";
import { FieldMessage } from "./FieldMessage";
import { FileDrop } from "./FileDrop";
import { TextField } from "./TextField";

interface ResumeFieldProps {
  readonly draft: ResumeDraft;
  readonly onModeChange: (mode: ResumeMode) => void;
  readonly onTextChange: (text: string) => void;
  readonly onPdfChange: (pdf: PdfResume | null) => void;
  readonly textStatus: FieldStatus;
  readonly remember: boolean;
  readonly onRememberChange: (value: boolean) => void;
  readonly saveWarning: string | null;
  readonly onClear: () => void;
}

const MODES: readonly { value: ResumeMode; label: string }[] = [
  { value: "file", label: "Upload file" },
  { value: "text", label: "Paste text" },
];

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ResumeField({
  draft,
  onModeChange,
  onTextChange,
  onPdfChange,
  textStatus,
  remember,
  onRememberChange,
  saveWarning,
  onClear,
}: ResumeFieldProps) {
  const id = useId();
  const [fileStatus, setFileStatus] = useState<FieldStatus>(null);

  async function handleFile(file: File) {
    const result = await readResumeFile(file);
    if (!result.ok) {
      setFileStatus({ level: "error", message: result.error });
      return;
    }
    if (result.kind === "pdf") {
      setFileStatus(null);
      onPdfChange(result.pdf);
      return;
    }
    // Text files go into the paste box so they can be reviewed and edited.
    onTextChange(result.text);
    onModeChange("text");
    setFileStatus(null);
  }

  return (
    <fieldset className="flex flex-col">
      <legend className="text-sm font-medium text-fg">Your resume</legend>
      <div className="mt-1 inline-flex w-fit rounded-lg border border-line-strong bg-sunken p-0.5">
        {MODES.map((mode) => (
          <label
            key={mode.value}
            className="cursor-pointer rounded-md px-3 py-1 text-sm text-fg-muted has-checked:bg-surface has-checked:font-medium has-checked:text-fg has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name={`${id}-mode`}
              value={mode.value}
              checked={draft.mode === mode.value}
              onChange={() => {
                onModeChange(mode.value);
              }}
              className="sr-only"
            />
            {mode.label}
          </label>
        ))}
      </div>

      <div className="mt-2">
        {draft.mode === "text" ? (
          <TextField
            label="Resume text"
            labelHidden
            hint="Paste it as plain text."
            value={draft.text}
            onChange={onTextChange}
            status={textStatus}
            placeholder="Jane Doe — Software Engineer…"
          />
        ) : (
          <>
            <p className="text-fg-muted text-xs">A PDF works best; .txt and .md also work.</p>
            {draft.pdf ? (
              <div className="border-line-strong bg-surface flex min-h-48 flex-col justify-center rounded-lg border p-4">
                <p className="text-fg text-sm font-medium break-all">{draft.pdf.fileName}</p>
                <p className="text-fg-muted text-xs">PDF, {formatSize(draft.pdf.sizeBytes)}</p>
                <button
                  type="button"
                  onClick={() => {
                    onPdfChange(null);
                  }}
                  className="btn-secondary mt-3 w-fit"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <FileDrop
                onFile={(file) => {
                  void handleFile(file);
                }}
                describedBy={`${id}-file-status ${id}-pdf-note`}
              />
            )}
          </>
        )}
        <FieldMessage id={`${id}-file-status`} status={fileStatus} />
        {draft.mode === "file" && (
          <p id={`${id}-pdf-note`} className="mt-1 text-xs text-fg-muted">
            Claude reads the PDF directly, layout included. It costs a little more than pasted text:
            roughly 1.5–3K input tokens per page (about half a cent per page on Sonnet).
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => {
              onRememberChange(e.target.checked);
            }}
            className="size-4 accent-accent"
          />
          Remember my resume on this device
        </label>
        <button
          type="button"
          onClick={onClear}
          disabled={!draft.text && !draft.pdf}
          className="btn-secondary px-2 py-1 text-xs"
        >
          Clear resume
        </button>
      </div>
      {saveWarning && <p className="mt-1 text-sm text-warn-text">{saveWarning}</p>}
    </fieldset>
  );
}
