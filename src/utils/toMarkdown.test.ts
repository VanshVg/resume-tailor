import { describe, expect, it } from "vitest";
import { validAnalysis } from "../test/fixtures";
import { markdownFileName, toMarkdown } from "./toMarkdown";

const meta = {
  modelLabel: "Claude Sonnet 5.5",
  cost: "$0.021",
  date: new Date("2026-10-02T10:00:00Z"),
};

describe("toMarkdown", () => {
  const md = toMarkdown(validAnalysis, meta);

  it("starts with the job and score", () => {
    expect(md.startsWith("# Resume analysis: Senior TypeScript Engineer at Acme\n")).toBe(true);
    expect(md).toContain("**Match score: 72/100**");
    expect(md).toContain("2026-10-02 · Claude Sonnet 5.5 · $0.021");
  });

  it("has every section, in the on-screen order", () => {
    const headings = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings).toEqual([
      "Strengths",
      "Missing keywords",
      "Bullet rewrites",
      "Section advice",
      "Gaps",
      "Cover letter points",
    ]);
  });

  it("formats keywords and rewrites", () => {
    expect(md).toContain("- **GraphQL** (medium): Mention the Apollo client work.");
    expect(md).toContain(
      "1. **Original:** Built UI\n   **Improved:** Built a React UI used by 3 teams\n   _Why:_ More specific",
    );
  });

  it("marks empty sections and keeps multi-line items on one line", () => {
    const out = toMarkdown({ ...validAnalysis, gaps: [], strengths: ["line one\nline two"] }, meta);
    expect(out).toMatch(/## Gaps\n\n_None\._/);
    expect(out).toContain("- line one line two");
  });
});

describe("markdownFileName", () => {
  it("slugifies the job label and adds the date", () => {
    expect(markdownFileName(validAnalysis, meta.date)).toBe(
      "senior-typescript-engineer-acme-2026-10-02.md",
    );
  });

  it("falls back when the title has no usable characters", () => {
    expect(markdownFileName({ ...validAnalysis, jobTitle: "???", company: null }, meta.date)).toBe(
      "resume-analysis-2026-10-02.md",
    );
  });
});
