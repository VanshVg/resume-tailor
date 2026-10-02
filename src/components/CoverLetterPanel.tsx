import { useId, useState } from "react";
import { getModelLabel, type ModelId } from "../config/models";
import { useCoverLetter } from "../hooks/useCoverLetter";
import type { CoverLetterInput } from "../prompts/coverLetter";
import type { AnalysisProvider } from "../services/provider";
import { CopyButton } from "./CopyButton";
import { ErrorBanner } from "./ErrorBanner";
import { ProgressPanel } from "./ProgressPanel";
import { SpendNote } from "./SpendNote";

interface CoverLetterPanelProps {
  readonly provider: AnalysisProvider;
  readonly apiKey: string;
  readonly modelId: ModelId;
  /** null when a cover letter can't be drafted yet (see `unavailableReason`). */
  readonly input: CoverLetterInput | null;
  readonly unavailableReason: string;
  /** Extra context shown under the button, e.g. which resume will be used. */
  readonly note?: string | undefined;
}

/**
 * Drafts a cover letter for one analysis. Render it with a `key` per
 * analysis so switching results starts fresh.
 */
export function CoverLetterPanel({
  provider,
  apiKey,
  modelId,
  input,
  unavailableReason,
  note,
}: CoverLetterPanelProps) {
  const { state, run, retry, cancel, reset } = useCoverLetter(provider);
  /** The user's edits to the finished draft; null until they type. */
  const [edited, setEdited] = useState<string | null>(null);
  const textareaId = useId();

  const missingKey = apiKey.trim() === "";
  const reason = !input ? unavailableReason : missingKey ? "Enter your API key above first." : null;

  function draft() {
    if (!input || missingKey) return;
    const hasEdits = state.status === "success" && edited !== null && edited !== state.text;
    if (hasEdits && !window.confirm("Regenerating replaces your edits. Continue?")) return;
    setEdited(null);
    run({ apiKey: apiKey.trim(), modelId, input });
  }

  return (
    <div role="group" aria-labelledby={`${textareaId}-heading`}>
      <h4 id={`${textareaId}-heading`} className="eyebrow">
        Cover letter draft
      </h4>

      {(state.status === "idle" || state.status === "success") && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={draft}
            disabled={reason !== null}
            className={state.status === "success" ? "btn-secondary" : "btn-primary"}
          >
            {state.status === "success" ? "Regenerate" : "Draft a cover letter"}
          </button>
          <p className="text-fg-muted text-sm">
            {reason ??
              `250–350 words, only facts from your resume. Uses ${getModelLabel(modelId)}.`}
          </p>
        </div>
      )}
      {note && state.status === "idle" && <p className="text-fg-subtle mt-1 text-xs">{note}</p>}

      {(state.status === "loading" || state.status === "streaming") && (
        <div className="mt-2 space-y-3">
          <ProgressPanel
            message={
              state.status === "loading"
                ? `${getModelLabel(modelId)} is planning the letter…`
                : "Writing your cover letter…"
            }
            onCancel={cancel}
          />
          {state.status === "streaming" && (
            <p className="border-line bg-sunken text-fg rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {state.partialText}
            </p>
          )}
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-2">
          <ErrorBanner
            kind={state.kind}
            partialText={state.partialText}
            spend={state.spend}
            onRetry={retry}
            onDismiss={reset}
          />
        </div>
      )}

      {state.status === "success" && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={textareaId} className="text-fg-muted text-sm">
              Edit freely, then copy it into your application.
            </label>
            <CopyButton text={edited ?? state.text} label="Copy cover letter" />
          </div>
          <textarea
            id={textareaId}
            value={edited ?? state.text}
            onChange={(e) => {
              setEdited(e.target.value);
            }}
            rows={16}
            className="input mt-1 w-full resize-y leading-relaxed"
          />
          <div className="mt-1">
            <SpendNote spend={state.spend} prefix="This draft cost" />
          </div>
        </div>
      )}
    </div>
  );
}
