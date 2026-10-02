import type { ModelOption, TokenUsage } from "../config/models";
import type { AnalyzeInput } from "../prompts/analyze";
import type { CoverLetterInput } from "../prompts/coverLetter";

/**
 * The seam between the UI and any AI provider. Hooks only talk to this
 * interface, so adding OpenAI or Gemini later means writing one new
 * implementation, not touching components.
 *
 * Both methods stream the model's raw text through `onText`, resolve with
 * the full text and token usage once the response is complete, and reject
 * with an `AnalysisError`.
 */
export interface AnalysisProvider {
  /** Returns JSON text; validation is the caller's job, so every provider gets the same parsing and retry behaviour. */
  analyze(request: AnalysisRequest): Promise<ProviderResponse>;
  /** Returns the plain-text letter. */
  draftCoverLetter(request: CoverLetterRequest): Promise<ProviderResponse>;
}

export interface StreamRequest<Input> {
  readonly apiKey: string;
  readonly model: ModelOption;
  readonly input: Input;
  readonly signal: AbortSignal;
  readonly onText: (chunk: string) => void;
}

export type AnalysisRequest = StreamRequest<AnalyzeInput>;
export type CoverLetterRequest = StreamRequest<CoverLetterInput>;

export interface ProviderResponse {
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

/**
 * Last-resort conversion for anything a provider throws that isn't already an
 * AnalysisError. Providers should map their own errors; this only guarantees
 * the hook always has a kind to show.
 */
export function asAnalysisError(error: unknown, signal: AbortSignal): AnalysisError {
  if (error instanceof AnalysisError) return error;
  if (signal.aborted) return new AnalysisError("cancelled", "Request cancelled by the user");
  return new AnalysisError("unknown", error instanceof Error ? error.name : "Unknown error");
}
