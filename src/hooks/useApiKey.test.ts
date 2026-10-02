import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../utils/storage";
import { useApiKey } from "./useApiKey";

describe("useApiKey", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the key in memory only by default", () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      result.current.setApiKey("sk-ant-1");
    });
    expect(result.current.apiKey).toBe("sk-ant-1");
    expect(localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
  });

  it("persists the key only after opting in, and forgets it when opting out", () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      result.current.setApiKey("sk-ant-1");
    });
    act(() => {
      result.current.setRemember(true);
    });
    expect(localStorage.getItem(STORAGE_KEYS.apiKey)).toBe("sk-ant-1");

    act(() => {
      result.current.setRemember(false);
    });
    expect(localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
    expect(result.current.apiKey).toBe("sk-ant-1");
  });

  it("restores a remembered key on load", () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, "sk-ant-saved");
    const { result } = renderHook(() => useApiKey());
    expect(result.current.apiKey).toBe("sk-ant-saved");
    expect(result.current.remember).toBe(true);
  });

  it("clear removes the key from memory and storage", () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, "sk-ant-saved");
    const { result } = renderHook(() => useApiKey());
    act(() => {
      result.current.clear();
    });
    expect(result.current.apiKey).toBe("");
    expect(localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
  });
});
