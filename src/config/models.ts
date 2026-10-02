/**
 * Every model the app offers, in one place. IDs and prices change over time;
 * check https://docs.claude.com before editing.
 *
 * Prices are USD per million tokens (Anthropic first-party API rates).
 */
export type Effort = "low" | "medium" | "high";

export interface ModelOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** One or two words for compact UI, e.g. "Balanced". */
  readonly tagline: string;
  readonly inputPricePerMTok: number;
  readonly outputPricePerMTok: number;
  /** Hard cap on output tokens (thinking + JSON), so a runaway response can't cost much. */
  readonly maxTokens: number;
  /**
   * How hard the model thinks before answering. `null` means the model does not
   * accept the effort parameter (Haiku 4.5), so it is not sent.
   */
  readonly effort: Effort | null;
  /** Shown next to the selector. Includes thinking tokens, hence a range. */
  readonly costHint: string;
}

export const MODELS = [
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    description: "Recommended. Best balance of quality, speed and cost.",
    tagline: "Recommended",
    inputPricePerMTok: 2,
    outputPricePerMTok: 10,
    maxTokens: 16_000,
    effort: "medium",
    costHint: "~$0.02–0.05",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    description: "Quick check. Fastest and cheapest, less nuanced.",
    tagline: "Fastest",
    inputPricePerMTok: 1,
    outputPricePerMTok: 5,
    maxTokens: 8_000,
    effort: null,
    costHint: "~$0.01–0.02",
  },
  {
    id: "claude-opus-5-5",
    label: "Claude Opus 5.5",
    description: "Deepest analysis. Slower and more expensive.",
    tagline: "Deepest",
    inputPricePerMTok: 4,
    outputPricePerMTok: 20,
    maxTokens: 16_000,
    effort: "medium",
    costHint: "~$0.04–0.10",
  },
] as const satisfies readonly ModelOption[];

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = "claude-sonnet-5-5";

export function getModel(id: ModelId): ModelOption {
  const model = MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  return model;
}

/** Label for display, tolerating IDs from saved history that are no longer offered. */
export function getModelLabel(id: string): string {
  return MODELS.find((m) => m.id === id)?.label ?? id;
}

export function isModelId(value: string): value is ModelId {
  return MODELS.some((m) => m.id === value);
}

export interface TokenUsage {
  readonly inputTokens: number;
  /** Includes thinking tokens, which are billed as output. */
  readonly outputTokens: number;
}

/** Actual cost in USD of a request, from the token counts the API reports. */
export function calculateCost(model: ModelOption, usage: TokenUsage): number {
  return (
    (usage.inputTokens * model.inputPricePerMTok + usage.outputTokens * model.outputPricePerMTok) /
    1_000_000
  );
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
  };
}

export function formatCost(usd: number): string {
  if (usd < 0.01) return `<$0.01`;
  return `$${usd.toFixed(usd < 1 ? 3 : 2)}`;
}
