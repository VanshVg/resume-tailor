import type { ModelOption, TokenUsage } from "../config/models";
import type { AnalyzeInput } from "../prompts/analyze";

/**
 * The seam between the UI and any AI provider. The hook only talks to this
 * interface, so adding OpenAI or Gemini later means writing one new
 * implementation, not touching components.
 */
export interface AnalysisProvider {
  /**
   * Streams the model's raw text through `onText` and resolves with the full
   * text once the response is complete. Validation is the caller's job, so
   * every provider gets the same parsing and retry behaviour.
   *
   * Rejects with an `AnalysisError`.
   */
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
}

export interface AnalysisRequest {
  readonly apiKey: string;
  readonly model: ModelOption;
  readonly input: AnalyzeInput;
  readonly signal: AbortSignal;
  readonly onText: (chunk: string) => void;
}

export interface AnalysisResponse {
  readonly text: string;
  readonly usage: TokenUsage;
}

export type AnalysisErrorKind =
  | "invalid_key"
  | "permission"
  | "billing"
  | "rate_limit"
  | "overloaded"
  | "network"
  | "timeout"
  | "model_unavailable"
  | "too_large"
  | "bad_request"
  | "refusal"
  | "truncated"
  | "invalid_output"
  | "cancelled"
  | "unknown";

/**
 * A provider failure in a form the UI can explain. The message is for
 * developers (console); user-facing copy comes from `describeError`.
 * Never put the API key in either.
 */
export class AnalysisError extends Error {
  readonly kind: AnalysisErrorKind;
  /** Tokens billed before the failure, if the API reported any. */
  readonly usage: TokenUsage | undefined;

  constructor(kind: AnalysisErrorKind, message: string, usage?: TokenUsage) {
    super(message);
    this.name = "AnalysisError";
    this.kind = kind;
    this.usage = usage;
  }
}
