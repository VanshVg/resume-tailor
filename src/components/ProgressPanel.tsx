interface ProgressPanelProps {
  readonly message: string;
  /** Optional second line, e.g. explaining an automatic retry. */
  readonly detail?: string | undefined;
  readonly onCancel: () => void;
}

export function ProgressPanel({ message, detail, onCancel }: ProgressPanelProps) {
  return (
    <div className="border-info-line bg-info-bg flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="border-info-line border-t-accent size-5 animate-spin rounded-full border-2 motion-reduce:animate-none"
        />
        <div role="status" className="text-info-fg text-sm">
          <p>{message}</p>
          {detail && <p className="text-xs">{detail}</p>}
        </div>
      </div>
      <button type="button" onClick={onCancel} className="btn-secondary">
        Cancel
      </button>
    </div>
  );
}
