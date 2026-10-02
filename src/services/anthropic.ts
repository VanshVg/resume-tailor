import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { TokenUsage } from "../config/models";
import { buildUserMessage, SYSTEM_PROMPT } from "../prompts/analyze";
import { AnalysisSchema } from "../schemas/analysis";
import {
  AnalysisError,
  type AnalysisProvider,
  type AnalysisRequest,
  type AnalysisResponse,
} from "./provider";

/**
 * Structured-output format generated from the Zod schema. We pass the bare
 * JSON Schema rather than the SDK's auto-parsing wrapper so validation
 * happens in one place (parseJson), with our own retry logic.
 */
const OUTPUT_FORMAT: Anthropic.JSONOutputFormat = {
  type: "json_schema",
  schema: zodOutputFormat(AnalysisSchema).schema,
};

const REQUEST_TIMEOUT_MS = 180_000;

function toUsage(usage: Anthropic.Usage): TokenUsage {
  return { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens };
}

/** Maps anything thrown by the SDK to an AnalysisError the UI can explain. */
export function toAnalysisError(error: unknown, signal?: AbortSignal): AnalysisError {
  if (error instanceof AnalysisError) return error;
  if (signal?.aborted || error instanceof Anthropic.APIUserAbortError) {
    return new AnalysisError("cancelled", "Request cancelled by the user");
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AnalysisError("timeout", "Request timed out");
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AnalysisError("network", "Network error");
  }
  if (error instanceof Anthropic.APIError) {
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

export const anthropicProvider: AnalysisProvider = {
  async analyze({
    apiKey,
    model,
    input,
    signal,
    onText,
  }: AnalysisRequest): Promise<AnalysisResponse> {
    // Safe in a browser here: the key is the user's own, typed into this page,
    // and is sent only to api.anthropic.com.
    const client = new Anthropic({
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
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserMessage(input) }],
          output_config: {
            format: OUTPUT_FORMAT,
            ...(model.effort === null ? {} : { effort: model.effort }),
          },
        },
        { signal },
      );
      stream.on("text", onText);
      message = await stream.finalMessage();
    } catch (error) {
      throw toAnalysisError(error, signal);
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
  },
};
