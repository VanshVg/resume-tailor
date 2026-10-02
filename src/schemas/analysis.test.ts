import { describe, expect, it } from "vitest";
import { validAnalysis } from "../test/fixtures";
import { AnalysisSchema, type Analysis } from "./analysis";

describe("AnalysisSchema", () => {
  it("accepts a valid analysis", () => {
    expect(AnalysisSchema.safeParse(validAnalysis).success).toBe(true);
  });

  it("accepts empty lists", () => {
    const result = AnalysisSchema.safeParse({
      ...validAnalysis,
      strengths: [],
      gaps: [],
      bulletRewrites: [],
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["above 100", 101],
    ["below 0", -1],
    ["not an integer", 72.5],
  ])("rejects a match score %s", (_label, matchScore) => {
    expect(AnalysisSchema.safeParse({ ...validAnalysis, matchScore }).success).toBe(false);
  });

  it("accepts a null company when the job description doesn't name one", () => {
    expect(AnalysisSchema.safeParse({ ...validAnalysis, company: null }).success).toBe(true);
  });

  it("rejects an unknown importance level", () => {
    const result = AnalysisSchema.safeParse({
      ...validAnalysis,
      missingKeywords: [{ keyword: "Go", importance: "critical", suggestion: "x" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field", () => {
    const withoutGaps: Partial<Analysis> = { ...validAnalysis };
    delete withoutGaps.gaps;
    expect(AnalysisSchema.safeParse(withoutGaps).success).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(AnalysisSchema.safeParse("not json").success).toBe(false);
    expect(AnalysisSchema.safeParse(null).success).toBe(false);
  });
});
