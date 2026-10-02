import type { Analysis } from "../schemas/analysis";

export interface MarkdownMeta {
  readonly modelLabel: string;
  readonly cost: string;
  readonly date: Date;
}

/** Keeps each list item on one line so model text can't break the list. */
function oneLine(text: string): string {
  return text.replace(/\s*\n\s*/g, " ").trim();
}

function list(items: readonly string[]): string {
  return items.length === 0 ? "_None._" : items.map((item) => `- ${oneLine(item)}`).join("\n");
}

function section(title: string, body: string): string {
  return `## ${title}\n\n${body}`;
}

export function jobLabel(analysis: Analysis): string {
  return analysis.company ? `${analysis.jobTitle} at ${analysis.company}` : analysis.jobTitle;
}

/** The analysis as a standalone Markdown document. */
export function toMarkdown(analysis: Analysis, meta: MarkdownMeta): string {
  const date = meta.date.toISOString().slice(0, 10);

  const keywords =
    analysis.missingKeywords.length === 0
      ? "_None._"
      : analysis.missingKeywords
          .map((k) => `- **${oneLine(k.keyword)}** (${k.importance}): ${oneLine(k.suggestion)}`)
          .join("\n");

  const rewrites =
    analysis.bulletRewrites.length === 0
      ? "_None._"
      : analysis.bulletRewrites
          .map(
            (r, i) =>
              `${i + 1}. **Original:** ${oneLine(r.original)}\n   **Improved:** ${oneLine(r.improved)}\n   _Why:_ ${oneLine(r.reason)}`,
          )
          .join("\n\n");

  const advice =
    analysis.sectionAdvice.length === 0
      ? "_None._"
      : analysis.sectionAdvice
          .map((a) => `- **${oneLine(a.section)}:** ${oneLine(a.advice)}`)
          .join("\n");

  return (
    [
      `# Resume analysis: ${oneLine(jobLabel(analysis))}`,
      `**Match score: ${analysis.matchScore}/100**  \n${date} · ${meta.modelLabel} · ${meta.cost}`,
      analysis.summary.trim(),
      section("Missing keywords", keywords),
      section("Bullet rewrites", rewrites),
      section("Strengths", list(analysis.strengths)),
      section("Gaps", list(analysis.gaps)),
      section("Section advice", advice),
      section("Cover letter points", list(analysis.coverLetterPoints)),
    ].join("\n\n") + "\n"
  );
}

/** A filesystem-friendly name like "senior-typescript-engineer-acme-2026-10-02.md". */
export function markdownFileName(analysis: Analysis, date: Date): string {
  const slug = jobLabel(analysis)
    .toLowerCase()
    .replace(/ at /g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "resume-analysis"}-${date.toISOString().slice(0, 10)}.md`;
}
