interface ProgressPanelProps {
  readonly message: string;
  /** Optional second line, e.g. explaining an automatic retry. */
  readonly detail?: string | undefined;
  readonly onCancel: () => void;
}

export function ProgressPanel({ message, detail, onCancel }: ProgressPanelProps) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="border-line border-t-accent size-5 animate-spin rounded-full border-2 motion-reduce:animate-none"
        />
        <div role="status" className="text-fg text-sm">
          <p className="font-medium">{message}</p>
          {detail && <p className="text-fg-muted text-xs">{detail}</p>}
        </div>
      </div>
      <button type="button" onClick={onCancel} className="btn-secondary">
        Cancel
      </button>
    </div>
  );
}

/** Placeholder blocks shaped like the results, shown while the analysis runs. */
export function ResultsSkeleton() {
  const block = "bg-sunken rounded-md animate-pulse motion-reduce:animate-none";
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className={`${block} size-28 rounded-full`} />
        <div className="flex-1 space-y-3">
          <div className={`${block} h-3 w-24`} />
          <div className={`${block} h-5 w-2/3`} />
          <div className={`${block} h-3 w-full`} />
          <div className={`${block} h-3 w-5/6`} />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className={`${block} h-4 w-40`} />
          <div className={`${block} h-3 w-full`} />
          <div className={`${block} h-3 w-4/5`} />
        </div>
      ))}
    </div>
  );
}
