import { describe, expect, it } from "vitest";
import { AnalysisSchema } from "../schemas/analysis";
import { validAnalysis } from "../test/fixtures";
import { extractJson, parseJson } from "./parseJson";

const json = JSON.stringify(validAnalysis);

describe("extractJson", () => {
  it("returns clean JSON unchanged", () => {
    expect(extractJson(json)).toBe(json);
  });

  it("strips ```json fences", () => {
    expect(extractJson("```json\n" + json + "\n```")).toBe(json);
  });

  it("strips bare ``` fences", () => {
    expect(extractJson("```\n" + json + "\n```")).toBe(json);
  });

  it("drops prose around a single object", () => {
    expect(extractJson(`Here you go:\n${json}\nHope that helps!`)).toBe(json);
  });
});

describe("parseJson", () => {
  it("parses clean JSON", () => {
    expect(parseJson(json, AnalysisSchema)).toEqual({ ok: true, data: validAnalysis });
  });

  it("parses JSON wrapped in markdown fences", () => {
    const result = parseJson("```json\n" + json + "\n```", AnalysisSchema);
    expect(result.ok).toBe(true);
  });

  it("reports garbage as not_json", () => {
    const result = parseJson("I can't help with that.", AnalysisSchema);
    expect(result).toMatchObject({ ok: false, reason: "not_json" });
  });

  it("reports truncated JSON as not_json", () => {
    const result = parseJson(json.slice(0, 50), AnalysisSchema);
    expect(result).toMatchObject({ ok: false, reason: "not_json" });
  });

  it("reports valid JSON with the wrong shape as schema_mismatch, with the path", () => {
    const result = parseJson(JSON.stringify({ ...validAnalysis, matchScore: 150 }), AnalysisSchema);
    expect(result).toMatchObject({ ok: false, reason: "schema_mismatch" });
    if (!result.ok) expect(result.issues).toContain("matchScore");
  });
});
