import { z } from "zod";

/**
 * The single source of truth for the analysis the model returns.
 *
 * It is used twice: converted to JSON Schema and sent to the API as the
 * structured-output format, and used again to validate the response before
 * the UI touches it. The API's constrained decoding ignores some keywords
 * (numeric bounds, for example), so the Zod check is what actually enforces
 * them.
 */
export const AnalysisSchema = z.object({
  matchScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Honest overall fit from 0 to 100. Do not inflate it."),
  summary: z.string().describe("2-3 sentences: overall fit and the biggest opportunity."),
  strengths: z.array(z.string()).describe("Things in the resume that already match the job well."),
  missingKeywords: z
    .array(
      z.object({
        keyword: z.string(),
        importance: z.enum(["high", "medium", "low"]),
        suggestion: z
          .string()
          .describe(
            "Where and how to include it honestly, only if the resume suggests the candidate has this experience.",
          ),
      }),
    )
    .describe("Important terms from the job description that are absent from the resume."),
  bulletRewrites: z
    .array(
      z.object({
        original: z.string().describe("The exact bullet from the resume."),
        improved: z.string().describe("Reworded for this job, with no invented facts."),
        reason: z.string(),
      }),
    )
    .describe("Rewrites of existing resume bullets."),
  sectionAdvice: z
    .array(z.object({ section: z.string(), advice: z.string() }))
    .describe("Reorder, emphasize, or trim guidance per resume section."),
  gaps: z
    .array(z.string())
    .describe("Requirements the resume genuinely does not show. Flag honestly; never fabricate."),
  coverLetterPoints: z
    .array(z.string())
    .describe("3-4 points worth emphasizing in a cover letter."),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type MissingKeyword = Analysis["missingKeywords"][number];
export type BulletRewrite = Analysis["bulletRewrites"][number];
export type Importance = MissingKeyword["importance"];
