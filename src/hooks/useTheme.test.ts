import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../utils/storage";
import { useTheme } from "./useTheme";

function mockSystemDark(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: dark,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.stubGlobal("matchMedia", () => query);
  return {
    change(next: boolean) {
      query.matches = next;
      listeners.forEach((fn) => {
        fn();
      });
    },
  };
}

const isDark = () => document.documentElement.classList.contains("dark");

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the system setting by default, including live changes", () => {
    const system = mockSystemDark(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("system");
    expect(isDark()).toBe(true);

    act(() => {
      system.change(false);
    });
    expect(isDark()).toBe(false);
  });

  it("an explicit choice overrides the system and is saved", () => {
    mockSystemDark(true);
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current[1]("light");
    });
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe("light");
  });

  it("choosing System again forgets the saved choice", () => {
    mockSystemDark(false);
    localStorage.setItem(STORAGE_KEYS.theme, "dark");
    const { result } = renderHook(() => useTheme());
    expect(isDark()).toBe(true);
    act(() => {
      result.current[1]("system");
    });
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBeNull();
  });
});
