import type { AnalysisErrorKind } from "./provider";

export interface ErrorDescription {
  readonly title: string;
  readonly message: string;
  /** Whether trying the same request again might work. */
  readonly retryable: boolean;
}

const DESCRIPTIONS: Record<AnalysisErrorKind, ErrorDescription> = {
  invalid_key: {
    title: "API key rejected",
    message:
      "Anthropic didn't accept this API key. Check that you copied the whole key from console.anthropic.com and that it hasn't been revoked.",
    retryable: false,
  },
  permission: {
    title: "Key not allowed",
    message: "This API key doesn't have permission to use the selected model.",
    retryable: false,
  },
  billing: {
    title: "Billing problem",
    message:
      "Anthropic reported a billing issue with this account. Check your credit balance in the Anthropic console.",
    retryable: false,
  },
  rate_limit: {
    title: "Rate limit reached",
    message: "Too many requests for this API key right now. Wait a minute and try again.",
    retryable: true,
  },
  overloaded: {
    title: "Anthropic is busy",
    message: "The service is temporarily overloaded or having problems. Try again in a moment.",
    retryable: true,
  },
  network: {
    title: "Connection problem",
    message: "Couldn't reach Anthropic, or the connection dropped. Check your internet connection.",
    retryable: true,
  },
  timeout: {
    title: "Request timed out",
    message: "Anthropic took too long to respond. Try again, or pick a faster model.",
    retryable: true,
  },
  model_unavailable: {
    title: "Model not available",
    message: "The selected model isn't available for this API key. Try a different model.",
    retryable: false,
  },
  too_large: {
    title: "Input too large",
    message: "The resume and job description are too long. Trim them and try again.",
    retryable: false,
  },
  bad_request: {
    title: "Request rejected",
    message: "Anthropic rejected the request. Try again; if it keeps happening, try another model.",
    retryable: true,
  },
  refusal: {
    title: "The model declined this request",
    message:
      "Claude declined to analyze this input. Check the text you pasted, or try rephrasing the job description.",
    retryable: true,
  },
  truncated: {
    title: "Response cut off",
    message:
      "The response hit its length limit before it finished. Try again, or shorten the inputs.",
    retryable: true,
  },
  invalid_output: {
    title: "Couldn't read the response",
    message: "The model's answer wasn't in the expected format, even after a retry. Try again.",
    retryable: true,
  },
  cancelled: {
    title: "Cancelled",
    message: "You stopped the analysis.",
    retryable: true,
  },
  unknown: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Try again.",
    retryable: true,
  },
};

export function describeError(kind: AnalysisErrorKind): ErrorDescription {
  return DESCRIPTIONS[kind];
}
