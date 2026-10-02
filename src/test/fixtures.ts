import type { Analysis } from "../schemas/analysis";

export const validAnalysis: Analysis = {
  matchScore: 72,
  summary: "Solid TypeScript background. Biggest opportunity: surface the React work.",
  strengths: ["5 years of TypeScript"],
  missingKeywords: [
    { keyword: "GraphQL", importance: "medium", suggestion: "Mention the Apollo client work." },
  ],
  bulletRewrites: [
    { original: "Built UI", improved: "Built a React UI used by 3 teams", reason: "More specific" },
  ],
  sectionAdvice: [{ section: "Skills", advice: "Lead with TypeScript." }],
  gaps: ["No Kubernetes experience shown"],
  coverLetterPoints: ["Ownership of the design system"],
};
