import { formatCost, getModelLabel } from "../config/models";
import type { HistoryEntry } from "../utils/history";

interface HistoryPanelProps {
  readonly enabled: boolean;
  readonly onEnabledChange: (value: boolean) => void;
  readonly entries: readonly HistoryEntry[];
  readonly viewingId: string | null;
  readonly onView: (entry: HistoryEntry) => void;
  readonly onDelete: (id: string) => void;
  readonly onClear: () => void;
  readonly warning: string | null;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function scoreColor(score: number): string {
  if (score >= 75) return "bg-good-soft text-good-soft-fg";
  if (score >= 50) return "bg-mid-soft text-mid-soft-fg";
  return "bg-bad-soft text-bad-soft-fg";
}

export function HistoryPanel({
  enabled,
  onEnabledChange,
  entries,
  viewingId,
  onView,
  onDelete,
  onClear,
  warning,
}: HistoryPanelProps) {
  function toggle(value: boolean) {
    if (
      !value &&
      entries.length > 0 &&
      !window.confirm(
        `Turning this off deletes your ${entries.length} saved ${entries.length === 1 ? "analysis" : "analyses"}. Continue?`,
      )
    ) {
      return;
    }
    onEnabledChange(value);
  }

  return (
    <section
      aria-labelledby="history-heading"
      className="rounded-xl border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="history-heading" className="text-lg font-semibold text-fg">
          Saved analyses{" "}
          {enabled && (
            <span className="text-sm font-normal text-fg-subtle">({entries.length})</span>
          )}
        </h2>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              toggle(e.target.checked);
            }}
            className="size-4 accent-accent"
          />
          Save analyses on this device
        </label>
      </div>

      {!enabled ? (
        <p className="mt-2 text-sm text-fg-muted">
          Off. Turn it on to keep your results (match score, suggestions and the job description,
          but never your resume) in this browser so you can compare jobs.
        </p>
      ) : entries.length === 0 ? (
        <p className="mt-2 text-sm text-fg-muted">
          Nothing saved yet. Your next analysis will appear here.
        </p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line-subtle">
            {entries.map((entry) => {
              const { jobTitle, company, matchScore } = entry.analysis;
              const label = company ? `${jobTitle} at ${company}` : jobTitle;
              return (
                <li key={entry.id} className="flex flex-wrap items-center gap-3 py-2">
                  <span
                    className={`w-12 shrink-0 rounded-md py-1 text-center text-sm font-semibold ${scoreColor(matchScore)}`}
                    aria-label={`Match score ${matchScore} out of 100`}
                  >
                    {matchScore}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{label}</p>
                    <p className="text-xs text-fg-subtle">
                      {dateFormat.format(new Date(entry.createdAt))} ·{" "}
                      {getModelLabel(entry.modelId)} · {formatCost(entry.spend.cost)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onView(entry);
                      }}
                      aria-current={viewingId === entry.id ? "true" : undefined}
                      aria-label={`View analysis for ${label}`}
                      className="btn-secondary px-2 py-1 text-xs aria-[current]:border-accent aria-[current]:text-accent-fg"
                    >
                      {viewingId === entry.id ? "Viewing" : "View"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(entry.id);
                      }}
                      aria-label={`Delete analysis for ${label}`}
                      className="btn-secondary px-2 py-1 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete all saved analyses?")) onClear();
            }}
            className="btn-secondary mt-3 px-2 py-1 text-xs"
          >
            Clear all
          </button>
        </>
      )}
      {warning && <p className="mt-2 text-sm text-warn-text">{warning}</p>}
    </section>
  );
}
