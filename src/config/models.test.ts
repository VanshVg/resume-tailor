import { describe, expect, it } from "vitest";
import { calculateCost, formatCost, getModel, isModelId, MODELS } from "./models";

describe("models config", () => {
  it("has unique model IDs", () => {
    const ids = MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("recognises known model IDs only", () => {
    expect(isModelId("claude-sonnet-5-5")).toBe(true);
    expect(isModelId("gpt-5")).toBe(false);
  });

  it("calculates cost from token usage", () => {
    const sonnet = getModel("claude-sonnet-5-5");
    // 3K in at $2/MTok + 1.5K out at $10/MTok = $0.006 + $0.015
    expect(calculateCost(sonnet, { inputTokens: 3000, outputTokens: 1500 })).toBeCloseTo(0.021);
  });

  it("formats costs", () => {
    expect(formatCost(0.004)).toBe("<$0.01");
    expect(formatCost(0.0213)).toBe("$0.021");
    expect(formatCost(1.234)).toBe("$1.23");
  });
});
