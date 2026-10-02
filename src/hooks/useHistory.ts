import { useCallback, useState } from "react";
import { addEntry, parseHistory, type HistoryEntry } from "../utils/history";
import { readItem, removeItem, STORAGE_KEYS, writeItem } from "../utils/storage";

export interface UseHistory {
  /** Whether new analyses are saved (opt-in). */
  readonly enabled: boolean;
  /** Turning it off also deletes saved history. */
  readonly setEnabled: (value: boolean) => void;
  readonly entries: readonly HistoryEntry[];
  /** Saves an entry if history is enabled; a no-op otherwise. */
  readonly add: (entry: HistoryEntry) => void;
  readonly remove: (id: string) => void;
  readonly clear: () => void;
  readonly warning: string | null;
}

/**
 * Writes entries, dropping the oldest ones if storage is full. Returns the
 * entries that were actually saved, or null if nothing could be written.
 */
function persist(entries: HistoryEntry[]): HistoryEntry[] | null {
  for (let keep = entries.length; keep >= 1; keep--) {
    const subset = entries.slice(0, keep);
    if (writeItem(STORAGE_KEYS.history, JSON.stringify(subset))) return subset;
  }
  return entries.length === 0 && removeItem(STORAGE_KEYS.history) ? [] : null;
}

export function useHistory(): UseHistory {
  const [enabled, setEnabledState] = useState(
    () => readItem(STORAGE_KEYS.historyEnabled) === "true",
  );
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    parseHistory(readItem(STORAGE_KEYS.history)),
  );
  const [warning, setWarning] = useState<string | null>(null);

  const save = useCallback((next: HistoryEntry[]) => {
    const saved = persist(next);
    if (saved === null) {
      setWarning("This browser wouldn't save your history (storage may be full or blocked).");
      setEntries(next);
    } else {
      setWarning(
        saved.length < next.length
          ? "Storage was full, so the oldest saved analyses were removed."
          : null,
      );
      setEntries(saved);
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (value) {
      writeItem(STORAGE_KEYS.historyEnabled, "true");
    } else {
      removeItem(STORAGE_KEYS.historyEnabled);
      removeItem(STORAGE_KEYS.history);
      setEntries([]);
      setWarning(null);
    }
  }, []);

  const add = useCallback(
    (entry: HistoryEntry) => {
      if (enabled) save(addEntry(entries, entry));
    },
    [enabled, entries, save],
  );

  const remove = useCallback(
    (id: string) => {
      save(entries.filter((e) => e.id !== id));
    },
    [entries, save],
  );

  const clear = useCallback(() => {
    removeItem(STORAGE_KEYS.history);
    setEntries([]);
    setWarning(null);
  }, []);

  return { enabled, setEnabled, entries, add, remove, clear, warning };
}
