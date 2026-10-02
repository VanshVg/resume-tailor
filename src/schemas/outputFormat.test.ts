import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { describe, expect, it } from "vitest";
import { AnalysisSchema } from "./analysis";

/**
 * Pins down how the Zod schema is translated for the API's structured
 * outputs, so an SDK or schema change that alters it shows up here.
 */
describe("structured-output JSON Schema generated from AnalysisSchema", () => {
  const { schema } = zodOutputFormat(AnalysisSchema);
  const properties = schema.properties as Record<string, Record<string, unknown>>;

  it("requires every field and forbids extra ones", () => {
    expect(schema.required).toEqual(Object.keys(AnalysisSchema.shape));
    expect(schema.additionalProperties).toBe(false);
  });

  it("drops matchScore's numeric bounds, which is why Zod must enforce them", () => {
    expect(properties.matchScore).not.toHaveProperty("minimum");
    expect(properties.matchScore).not.toHaveProperty("maximum");
    expect(properties.matchScore?.description).toContain("{minimum: 0, maximum: 100}");
  });

  it("expresses a nullable company as string-or-null", () => {
    const defs = (schema.$defs ?? {}) as Record<string, unknown>;
    const resolve = (node: unknown): unknown => {
      if (typeof node === "object" && node !== null && "$ref" in node) {
        return defs[String(node.$ref).replace("#/$defs/", "")];
      }
      return node;
    };
    const variants = properties.company?.anyOf as unknown[];
    expect(variants.map(resolve)).toEqual([
      expect.objectContaining({ type: "string" }),
      { type: "null" },
    ]);
  });
});
