import { z } from "zod";
import { AnalysisSchema } from "../schemas/analysis";

export const MAX_HISTORY_ENTRIES = 25;

/**
 * One saved analysis. Deliberately excludes the resume: history is for
 * comparing jobs, and the resume has its own opt-in storage.
 */
export const HistoryEntrySchema = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  /** A string, not ModelId: saved entries may outlive a model in the config. */
  modelId: z.string(),
  analysis: AnalysisSchema,
  jobDescription: z.string(),
  spend: z.object({
    usage: z.object({ inputTokens: z.number(), outputTokens: z.number() }),
    cost: z.number(),
  }),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

/**
 * Parses stored history, keeping every valid entry and dropping invalid
 * ones, so one corrupted record doesn't wipe the rest.
 */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (raw === null) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    const parsed = HistoryEntrySchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Newest first, capped. */
export function addEntry(entries: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...entries.filter((e) => e.id !== entry.id)].slice(0, MAX_HISTORY_ENTRIES);
}

export function newEntryId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
