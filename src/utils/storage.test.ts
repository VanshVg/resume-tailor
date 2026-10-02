import { beforeEach, describe, expect, it, vi } from "vitest";
import { readItem, removeItem, writeItem } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a value", () => {
    expect(writeItem("k", "v")).toBe(true);
    expect(readItem("k")).toBe("v");
    expect(removeItem("k")).toBe(true);
    expect(readItem("k")).toBeNull();
  });

  it("returns null for a missing key", () => {
    expect(readItem("missing")).toBeNull();
  });

  describe("when localStorage methods throw", () => {
    beforeEach(() => {
      const fail = () => {
        throw new DOMException("blocked", "SecurityError");
      };
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(fail);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(fail);
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(fail);
    });

    it("fails soft instead of throwing", () => {
      expect(readItem("k")).toBeNull();
      expect(writeItem("k", "v")).toBe(false);
      expect(removeItem("k")).toBe(false);
    });
  });

  describe("when accessing localStorage itself throws", () => {
    it("fails soft instead of throwing", () => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
      expect(readItem("k")).toBeNull();
      expect(writeItem("k", "v")).toBe(false);
      expect(removeItem("k")).toBe(false);
    });
  });
});
