import type Anthropic from "@anthropic-ai/sdk";
import type { TokenUsage } from "../config/models";
import { buildUserMessage, SYSTEM_PROMPT } from "../prompts/analyze";
import { buildCoverLetterMessage, COVER_LETTER_SYSTEM_PROMPT } from "../prompts/coverLetter";
import type { ResumeInput } from "../types/resume";
import { AnalysisSchema } from "../schemas/analysis";
import {
  AnalysisError,
  type AnalysisProvider,
  type AnalysisRequest,
  type CoverLetterRequest,
  type ProviderResponse,
  type StreamRequest,
} from "./provider";

type Sdk = typeof import("@anthropic-ai/sdk");

const REQUEST_TIMEOUT_MS = 180_000;

/**
 * The SDK (plus Zod's JSON Schema converter) is most of the bundle, so it is
 * loaded on the first analysis rather than on page load.
 */
async function loadSdk(): Promise<{
  Anthropic: Sdk["default"];
  format: Anthropic.JSONOutputFormat;
}> {
  const [sdk, { zodOutputFormat }] = await Promise.all([
    import("@anthropic-ai/sdk"),
    import("@anthropic-ai/sdk/helpers/zod"),
  ]);
  return {
    Anthropic: sdk.default,
    // Structured-output format generated from the Zod schema. We pass the bare
    // JSON Schema rather than the SDK's auto-parsing wrapper so validation
    // happens in one place (parseJson), with our own retry logic.
    format: { type: "json_schema", schema: zodOutputFormat(AnalysisSchema).schema },
  };
}

/** The user turn: a PDF resume goes first as a document block, then the text. */
export function buildUserContent(
  resume: ResumeInput,
  text: string,
): Anthropic.MessageParam["content"] {
  if (resume.kind === "text") return text;
  return [
    {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: resume.base64 },
      title: "Resume",
    },
    { type: "text", text },
  ];
}

function toUsage(usage: Anthropic.Usage): TokenUsage {
  return { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens };
}

/** Maps anything thrown by the SDK to an AnalysisError the UI can explain. */
export function toAnalysisError(
  sdk: Sdk["default"],
  error: unknown,
  signal?: AbortSignal,
): AnalysisError {
  if (error instanceof AnalysisError) return error;
  if (signal?.aborted || error instanceof sdk.APIUserAbortError) {
    return new AnalysisError("cancelled", "Request cancelled by the user");
  }
  if (error instanceof sdk.APIConnectionTimeoutError) {
    return new AnalysisError("timeout", "Request timed out");
  }
  if (error instanceof sdk.APIConnectionError) {
    return new AnalysisError("network", "Network error");
  }
  if (error instanceof sdk.APIError) {
    const detail = `HTTP ${error.status ?? "?"} (${error.type ?? "no type"})`;
    switch (error.status) {
      case 400:
        return new AnalysisError("bad_request", detail);
      case 401:
        return new AnalysisError("invalid_key", detail);
      case 402:
        return new AnalysisError("billing", detail);
      case 403:
        return new AnalysisError("permission", detail);
      case 404:
        return new AnalysisError("model_unavailable", detail);
      case 413:
        return new AnalysisError("too_large", detail);
      case 429:
        return new AnalysisError("rate_limit", detail);
      case undefined:
        // The SDK raises a status-less APIError when an SSE stream breaks off
        // or carries an error event partway through.
        return error.type === "overloaded_error"
          ? new AnalysisError("overloaded", detail)
          : new AnalysisError("network", detail);
      default:
        return error.status >= 500
          ? new AnalysisError("overloaded", detail)
          : new AnalysisError("unknown", detail);
    }
  }
  // AnthropicError without a status: e.g. the stream ended before a message.
  return new AnalysisError("network", error instanceof Error ? error.name : "Unknown error");
}

type LoadedSdk = Awaited<ReturnType<typeof loadSdk>>;

interface StreamOptions {
  readonly system: string;
  readonly content: Anthropic.MessageParam["content"];
  /** Constrain the response to the analysis JSON Schema. */
  readonly structured: boolean;
}

/** Shared by both tasks: one streamed message, errors and stop reasons mapped. */
async function streamMessage(
  { apiKey, model, signal, onText }: StreamRequest<unknown>,
  build: (sdk: LoadedSdk) => StreamOptions,
): Promise<ProviderResponse> {
  let sdk: LoadedSdk;
  try {
    sdk = await loadSdk();
  } catch {
    // A failed chunk download (offline, or a stale tab after a deploy).
    throw new AnalysisError("network", "Failed to load the Anthropic SDK");
  }
  const { system, content, structured } = build(sdk);

  // Safe in a browser here: the key is the user's own, typed into this page,
  // and is sent only to api.anthropic.com.
  const client = new sdk.Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    maxRetries: 1,
    timeout: REQUEST_TIMEOUT_MS,
  });

  let message: Anthropic.Message;
  try {
    const stream = client.messages.stream(
      {
        model: model.id,
        max_tokens: model.maxTokens,
        system,
        messages: [{ role: "user", content }],
        output_config: {
          ...(structured ? { format: sdk.format } : {}),
          ...(model.effort === null ? {} : { effort: model.effort }),
        },
      },
      { signal },
    );
    stream.on("text", onText);
    message = await stream.finalMessage();
  } catch (error) {
    throw toAnalysisError(sdk.Anthropic, error, signal);
  }

  const usage = toUsage(message.usage);
  switch (message.stop_reason) {
    case "refusal":
      throw new AnalysisError("refusal", "stop_reason: refusal", usage);
    case "max_tokens":
      throw new AnalysisError("truncated", "stop_reason: max_tokens", usage);
    case "model_context_window_exceeded":
      throw new AnalysisError("too_large", "stop_reason: model_context_window_exceeded", usage);
    default:
      break;
  }

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return { text, usage };
}

export const anthropicProvider: AnalysisProvider = {
  analyze(request: AnalysisRequest) {
    return streamMessage(request, () => ({
      system: SYSTEM_PROMPT,
      content: buildUserContent(request.input.resume, buildUserMessage(request.input)),
      structured: true,
    }));
  },

  draftCoverLetter(request: CoverLetterRequest) {
    return streamMessage(request, () => ({
      system: COVER_LETTER_SYSTEM_PROMPT,
      content: buildUserContent(request.input.resume, buildCoverLetterMessage(request.input)),
      structured: false,
    }));
  },
};
