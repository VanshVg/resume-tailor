import { describe, expect, it } from "vitest";
import { validAnalysis } from "../test/fixtures";
import { addEntry, MAX_HISTORY_ENTRIES, parseHistory, type HistoryEntry } from "./history";

function entry(id: string): HistoryEntry {
  return {
    id,
    createdAt: "2026-10-02T10:00:00.000Z",
    modelId: "claude-sonnet-5-5",
    analysis: validAnalysis,
    jobDescription: "Senior TS engineer",
    spend: { usage: { inputTokens: 3000, outputTokens: 1500 }, cost: 0.021 },
  };
}

describe("parseHistory", () => {
  it("round-trips valid entries", () => {
    const entries = [entry("a"), entry("b")];
    expect(parseHistory(JSON.stringify(entries))).toEqual(entries);
  });

  it("drops invalid entries but keeps valid ones", () => {
    const raw = JSON.stringify([entry("a"), { id: "broken" }, entry("c")]);
    expect(parseHistory(raw).map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("returns an empty list for missing, malformed or non-array data", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("{nope")).toEqual([]);
    expect(parseHistory('{"id":"a"}')).toEqual([]);
  });
});

describe("addEntry", () => {
  it("puts the newest entry first", () => {
    expect(addEntry([entry("a")], entry("b")).map((e) => e.id)).toEqual(["b", "a"]);
  });

  it(`keeps at most ${MAX_HISTORY_ENTRIES} entries, dropping the oldest`, () => {
    const full = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) => entry(String(i)));
    const result = addEntry(full, entry("new"));
    expect(result).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(result[0]?.id).toBe("new");
    expect(result.at(-1)?.id).toBe(String(MAX_HISTORY_ENTRIES - 2));
  });
});
