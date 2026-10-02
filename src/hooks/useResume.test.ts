import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../utils/storage";
import { MAX_SAVED_PDF_BYTES, toResumeInput, useResume } from "./useResume";

const pdf = { fileName: "cv.pdf", base64: "JVBERi0=", sizeBytes: 5 };

describe("toResumeInput", () => {
  it("uses the active tab only", () => {
    expect(toResumeInput({ mode: "text", text: "Jane", pdf })).toEqual({
      kind: "text",
      text: "Jane",
    });
    expect(toResumeInput({ mode: "file", text: "Jane", pdf })).toEqual({ kind: "pdf", ...pdf });
  });

  it("returns null for an empty tab", () => {
    expect(toResumeInput({ mode: "text", text: "  ", pdf })).toBeNull();
    expect(toResumeInput({ mode: "file", text: "Jane", pdf: null })).toBeNull();
  });
});

describe("useResume", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts on the upload tab and saves nothing by default", () => {
    const { result } = renderHook(() => useResume());
    expect(result.current.draft.mode).toBe("file");
    act(() => {
      result.current.setPdf(pdf);
    });
    expect(result.current.remember).toBe(false);
    expect(localStorage.length).toBe(0);
  });

  it("saves text and PDF after opting in, and removes them when opting out", () => {
    const { result } = renderHook(() => useResume());
    act(() => {
      result.current.setPdf(pdf);
    });
    act(() => {
      result.current.setRemember(true);
    });
    act(() => {
      result.current.setText("Jane Doe");
    });
    expect(localStorage.getItem(STORAGE_KEYS.resumePdf)).toBe(JSON.stringify(pdf));
    expect(localStorage.getItem(STORAGE_KEYS.resumeText)).toBe("Jane Doe");

    act(() => {
      result.current.setRemember(false);
    });
    expect(localStorage.length).toBe(0);
    expect(result.current.draft.pdf).toEqual(pdf);
  });

  it("restores a saved PDF on load and opens the upload tab", () => {
    localStorage.setItem(STORAGE_KEYS.resumePdf, JSON.stringify(pdf));
    const { result } = renderHook(() => useResume());
    expect(result.current.remember).toBe(true);
    expect(result.current.draft).toMatchObject({ mode: "file", pdf });
  });

  it("restores saved text on load and opens the paste tab", () => {
    localStorage.setItem(STORAGE_KEYS.resumeText, "Jane Doe");
    const { result } = renderHook(() => useResume());
    expect(result.current.draft).toMatchObject({ mode: "text", text: "Jane Doe" });
  });

  it("ignores corrupted saved data", () => {
    localStorage.setItem(STORAGE_KEYS.resumePdf, '{"fileName": 3}');
    const { result } = renderHook(() => useResume());
    expect(result.current.draft.pdf).toBeNull();
  });

  it("warns instead of saving a PDF over the size cap", () => {
    const { result } = renderHook(() => useResume());
    act(() => {
      result.current.setRemember(true);
    });
    act(() => {
      result.current.setPdf({ ...pdf, sizeBytes: MAX_SAVED_PDF_BYTES + 1 });
    });
    expect(localStorage.getItem(STORAGE_KEYS.resumePdf)).toBeNull();
    expect(result.current.saveWarning).toContain("too large to save");
  });

  it("clear empties both tabs and deletes saved data", () => {
    localStorage.setItem(STORAGE_KEYS.resumePdf, JSON.stringify(pdf));
    localStorage.setItem(STORAGE_KEYS.resumeText, "Jane");
    const { result } = renderHook(() => useResume());
    act(() => {
      result.current.clear();
    });
    expect(result.current.draft).toMatchObject({ text: "", pdf: null });
    expect(localStorage.length).toBe(0);
  });
});
