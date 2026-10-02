import { useId } from "react";
import { getModel, isModelId, MODELS, type ModelId } from "../config/models";
import type { FieldStatus } from "../utils/validateInputs";
import { ArrowRightIcon, LockIcon } from "./ui/icons";

interface ActionBarProps {
  readonly modelId: ModelId;
  readonly onModelChange: (value: ModelId) => void;
  /** First reason Analyze is disabled, if any. */
  readonly blocker: string | null;
  readonly busy: boolean;
  readonly sizeWarning: FieldStatus;
  readonly hasPdf: boolean;
}

export function ActionBar({
  modelId,
  onModelChange,
  blocker,
  busy,
  sizeWarning,
  hasPdf,
}: ActionBarProps) {
  const id = useId();
  const model = getModel(modelId);

  return (
    <div className="space-y-3">
      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <label htmlFor={`${id}-model`} className="text-fg text-sm font-medium">
            Model
          </label>
          <select
            id={`${id}-model`}
            value={modelId}
            onChange={(e) => {
              if (isModelId(e.target.value)) onModelChange(e.target.value);
            }}
            aria-describedby={`${id}-cost`}
            className="input py-1.5 pr-8"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · {m.tagline}
              </option>
            ))}
          </select>
          <span id={`${id}-cost`} className="text-fg-subtle text-xs">
            {model.costHint} per run{hasPdf ? " + ~½¢ per PDF page" : ""}
          </span>
        </div>
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <button
            type="submit"
            disabled={blocker !== null || busy}
            aria-describedby={blocker ? `${id}-blocker` : undefined}
            className="btn-primary px-5 py-2.5"
          >
            {busy ? "Analyzing…" : "Analyze"}
            {!busy && <ArrowRightIcon />}
          </button>
          {blocker && !busy && (
            <p id={`${id}-blocker`} className="text-fg-subtle text-xs">
              {blocker}
            </p>
          )}
        </div>
      </div>
      {sizeWarning && <p className="text-warn-text text-sm">{sizeWarning.message}</p>}
      <p className="text-fg-subtle flex items-start gap-2 text-xs">
        <LockIcon className="mt-0.5 size-3.5 shrink-0" />
        Your resume and the job description go only to Anthropic, directly from your browser. Remove
        anything you&apos;d rather not share, like your phone number or address.
      </p>
    </div>
  );
}
