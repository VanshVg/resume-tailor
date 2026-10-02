import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validAnalysis } from "../test/fixtures";
import { parseHistory, type HistoryEntry } from "../utils/history";
import { STORAGE_KEYS } from "../utils/storage";
import { useHistory } from "./useHistory";

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

describe("useHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is off by default and saves nothing", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.enabled).toBe(false);
    act(() => {
      result.current.add(entry("a"));
    });
    expect(result.current.entries).toEqual([]);
    expect(localStorage.length).toBe(0);
  });

  it("saves entries once enabled, and restores them on load", () => {
    const first = renderHook(() => useHistory());
    act(() => {
      first.result.current.setEnabled(true);
    });
    act(() => {
      first.result.current.add(entry("a"));
    });
    const second = renderHook(() => useHistory());
    expect(second.result.current.enabled).toBe(true);
    expect(second.result.current.entries.map((e) => e.id)).toEqual(["a"]);
  });

  it("removes a single entry", () => {
    localStorage.setItem(STORAGE_KEYS.historyEnabled, "true");
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify([entry("a"), entry("b")]));
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.remove("a");
    });
    expect(result.current.entries.map((e) => e.id)).toEqual(["b"]);
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(JSON.stringify([entry("b")]));
  });

  it("turning history off deletes what was saved", () => {
    localStorage.setItem(STORAGE_KEYS.historyEnabled, "true");
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify([entry("a")]));
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.setEnabled(false);
    });
    expect(result.current.entries).toEqual([]);
    expect(localStorage.length).toBe(0);
  });

  it("drops the oldest entries when storage is full", () => {
    localStorage.setItem(STORAGE_KEYS.historyEnabled, "true");
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify([entry("old1"), entry("old2")]));
    const { result } = renderHook(() => useHistory());

    // Bound before spying, so it still points at the real implementation.
    const realSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
      // Pretend only two entries fit.
      if (key === STORAGE_KEYS.history && parseHistory(value).length > 2) {
        throw new DOMException("full", "QuotaExceededError");
      }
      realSetItem(key, value);
    });

    act(() => {
      result.current.add(entry("new"));
    });
    expect(result.current.entries.map((e) => e.id)).toEqual(["new", "old1"]);
    expect(result.current.warning).toContain("oldest");
  });
});
