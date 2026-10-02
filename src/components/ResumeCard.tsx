import { useId, useState } from "react";
import type { UseResume, ResumeMode } from "../hooks/useResume";
import { readResumeFile } from "../utils/readResumeFile";
import type { FieldStatus } from "../utils/validateInputs";
import { FieldMessage } from "./FieldMessage";
import { FileDrop } from "./FileDrop";
import { StepCard } from "./ui/Card";
import { FileIcon } from "./ui/icons";
import { Segmented, type SegmentedOption } from "./ui/Segmented";

const MODES: readonly SegmentedOption<ResumeMode>[] = [
  { value: "file", label: "Upload" },
  { value: "text", label: "Paste" },
];

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface ResumeCardProps {
  readonly resume: UseResume;
  readonly textStatus: FieldStatus;
}

export function ResumeCard({ resume, textStatus }: ResumeCardProps) {
  const id = useId();
  const [fileStatus, setFileStatus] = useState<FieldStatus>(null);
  const { draft } = resume;

  async function handleFile(file: File) {
    const result = await readResumeFile(file);
    if (!result.ok) {
      setFileStatus({ level: "error", message: result.error });
      return;
    }
    setFileStatus(null);
    if (result.kind === "pdf") {
      resume.setPdf(result.pdf);
    } else {
      // Text files go into the paste box so they can be reviewed and edited.
      resume.setText(result.text);
      resume.setMode("text");
    }
  }

  const hasContent = Boolean(draft.text || draft.pdf);

  return (
    <StepCard
      step={1}
      title="Your resume"
      headingId={`${id}-heading`}
      actions={
        <Segmented
          legend="Resume source"
          options={MODES}
          value={draft.mode}
          onChange={resume.setMode}
          size="sm"
        />
      }
      footer={
        <>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={resume.remember}
              onChange={(e) => {
                resume.setRemember(e.target.checked);
              }}
              className="accent-accent size-3.5"
            />
            Remember on this device
          </label>
          <span className="flex items-center gap-3">
            {draft.mode === "text" && (
              <span className="tabular-nums">
                {draft.text.length.toLocaleString("en-US")} characters
              </span>
            )}
            {hasContent && (
              <button
                type="button"
                onClick={resume.clear}
                className="text-fg-muted hover:text-fg underline-offset-2 hover:underline"
              >
                Clear resume
              </button>
            )}
          </span>
        </>
      }
    >
      <div className="h-72">
        {draft.mode === "text" ? (
          <>
            <label htmlFor={`${id}-text`} className="sr-only">
              Resume text
            </label>
            <textarea
              id={`${id}-text`}
              value={draft.text}
              onChange={(e) => {
                resume.setText(e.target.value);
              }}
              placeholder="Paste your resume as plain text…"
              aria-invalid={textStatus?.level === "error"}
              aria-describedby={`${id}-text-status`}
              className="input h-full w-full resize-none"
            />
          </>
        ) : draft.pdf ? (
          <div className="border-line-strong flex h-full flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
            <span className="bg-info-bg text-accent-fg grid size-11 place-items-center rounded-full">
              <FileIcon className="size-5" />
            </span>
            <div>
              <p className="text-fg text-sm font-medium break-all">{draft.pdf.fileName}</p>
              <p className="text-fg-subtle text-xs">
                PDF · {formatSize(draft.pdf.sizeBytes)} · read directly by Claude
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resume.setPdf(null);
              }}
              className="btn-secondary px-2.5 py-1 text-xs"
            >
              Remove file
            </button>
          </div>
        ) : (
          <FileDrop
            onFile={(file) => {
              void handleFile(file);
            }}
            describedBy={`${id}-file-status`}
          />
        )}
      </div>
      <FieldMessage id={`${id}-text-status`} status={draft.mode === "text" ? textStatus : null} />
      <FieldMessage id={`${id}-file-status`} status={fileStatus} />
      {resume.saveWarning && <p className="text-warn-text mt-1 text-sm">{resume.saveWarning}</p>}
    </StepCard>
  );
}
