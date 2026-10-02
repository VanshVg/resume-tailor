import type { z } from "zod";

export type ParseResult<T> =
  | { readonly ok: true; readonly data: T }
  | {
      readonly ok: false;
      readonly reason: "not_json" | "schema_mismatch";
      readonly issues: string;
    };

const FENCE_PATTERN = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;

/**
 * Pulls a JSON value out of model output. Structured outputs should give us
 * clean JSON, but this also tolerates markdown fences and stray prose around
 * a single top-level object, which older or unconstrained responses produce.
 */
export function extractJson(text: string): string {
  const trimmed = text.trim();

  const fenced = FENCE_PATTERN.exec(trimmed);
  if (fenced?.[1] !== undefined) return fenced[1].trim();

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first > 0 && last > first) return trimmed.slice(first, last + 1);

  return trimmed;
}

/** Parses model output as JSON and validates it. Never throws. */
export function parseJson<Schema extends z.ZodType>(
  text: string,
  schema: Schema,
): ParseResult<z.infer<Schema>> {
  let value: unknown;
  try {
    value = JSON.parse(extractJson(text));
  } catch (error) {
    return {
      ok: false,
      reason: "not_json",
      issues: error instanceof Error ? error.message : String(error),
    };
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    return { ok: false, reason: "schema_mismatch", issues };
  }
  return { ok: true, data: result.data };
}
