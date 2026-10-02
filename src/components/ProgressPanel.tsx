interface ProgressPanelProps {
  readonly phase: "loading" | "streaming";
  readonly attempt: number;
  readonly receivedChars: number;
  readonly modelLabel: string;
  readonly onCancel: () => void;
}

export function ProgressPanel({
  phase,
  attempt,
  receivedChars,
  modelLabel,
  onCancel,
}: ProgressPanelProps) {
  const message =
    phase === "loading"
      ? `${modelLabel} is reading your resume and thinking…`
      : `Writing suggestions… ${receivedChars.toLocaleString("en-US")} characters received`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700 motion-reduce:animate-none"
        />
        <div role="status" className="text-sm text-indigo-950">
          <p>{message}</p>
          {attempt > 1 && (
            <p className="text-xs">
              The first response wasn&apos;t in the expected format, so this is an automatic retry.
            </p>
          )}
        </div>
      </div>
      <button type="button" onClick={onCancel} className="btn-secondary">
        Cancel
      </button>
    </div>
  );
}
