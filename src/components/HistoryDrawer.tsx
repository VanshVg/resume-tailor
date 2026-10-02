import { formatCost, getModelLabel } from "../config/models";
import type { HistoryEntry } from "../utils/history";
import { jobLabel } from "../utils/toMarkdown";
import { scoreBand, type ScoreTone } from "./ScoreRing";
import { TrashIcon } from "./ui/icons";
import { Modal } from "./ui/Modal";

interface HistoryDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
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

const SCORE_BADGE: Record<ScoreTone, string> = {
  good: "bg-good-soft text-good-soft-fg",
  mid: "bg-mid-soft text-mid-soft-fg",
  bad: "bg-bad-soft text-bad-soft-fg",
};

export function HistoryDrawer({
  open,
  onClose,
  enabled,
  onEnabledChange,
  entries,
  viewingId,
  onView,
  onDelete,
  onClear,
  warning,
}: HistoryDrawerProps) {
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
    <Modal
      open={open}
      onClose={onClose}
      variant="drawer"
      title="Saved analyses"
      description="Compare match scores across jobs. Stored only in this browser, never your resume."
    >
      <label className="border-line bg-sunken text-fg flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium">
        Save analyses on this device
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            toggle(e.target.checked);
          }}
          className="accent-accent size-4"
        />
      </label>

      {!enabled ? (
        <p className="text-fg-muted mt-4 text-sm">
          Off. Turn it on to keep each result (score, suggestions and the job description) so you
          can come back to it.
        </p>
      ) : entries.length === 0 ? (
        <p className="text-fg-muted mt-4 text-sm">
          Nothing saved yet. Your next analysis will appear here.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {entries.map((entry) => {
              const label = jobLabel(entry.analysis);
              const band = scoreBand(entry.analysis.matchScore);
              const current = viewingId === entry.id;
              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-1 rounded-xl border ${current ? "border-accent" : "border-line"}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onView(entry);
                    }}
                    aria-current={current ? "true" : undefined}
                    aria-label={`View analysis for ${label}, match score ${entry.analysis.matchScore}`}
                    className="hover:bg-sunken focus-visible:outline-focus flex min-w-0 flex-1 items-center gap-3 rounded-l-xl p-3 text-left focus-visible:outline-2"
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-lg text-sm font-semibold tabular-nums ${SCORE_BADGE[band.tone]}`}
                    >
                      {entry.analysis.matchScore}
                    </span>
                    <span className="min-w-0">
                      <span className="text-fg block truncate text-sm font-medium">{label}</span>
                      <span className="text-fg-subtle block text-xs">
                        {dateFormat.format(new Date(entry.createdAt))} ·{" "}
                        {getModelLabel(entry.modelId)} · {formatCost(entry.spend.cost)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(entry.id);
                    }}
                    aria-label={`Delete analysis for ${label}`}
                    className="btn-icon mr-2 shrink-0"
                  >
                    <TrashIcon />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete all saved analyses?")) onClear();
            }}
            className="btn-ghost text-danger-text mt-3"
          >
            Clear all
          </button>
        </>
      )}
      {warning && <p className="text-warn-text mt-3 text-sm">{warning}</p>}
    </Modal>
  );
}
