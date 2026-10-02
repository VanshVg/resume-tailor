import Anthropic, { type APIError } from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { toAnalysisError } from "./anthropic";
import { AnalysisError } from "./provider";

function apiError(status: number): APIError {
  return Anthropic.APIError.generate(status, { type: "error" }, "msg", new Headers());
}

describe("toAnalysisError", () => {
  it.each([
    [400, "bad_request"],
    [401, "invalid_key"],
    [402, "billing"],
    [403, "permission"],
    [404, "model_unavailable"],
    [413, "too_large"],
    [429, "rate_limit"],
    [500, "overloaded"],
    [529, "overloaded"],
  ] as const)("maps HTTP %i to %s", (status, kind) => {
    expect(toAnalysisError(apiError(status)).kind).toBe(kind);
  });

  it("maps user aborts to cancelled", () => {
    expect(toAnalysisError(new Anthropic.APIUserAbortError()).kind).toBe("cancelled");
  });

  it("treats anything thrown after the signal aborted as cancelled", () => {
    const controller = new AbortController();
    controller.abort();
    expect(toAnalysisError(new Error("boom"), controller.signal).kind).toBe("cancelled");
  });

  it("maps timeouts and connection failures", () => {
    expect(toAnalysisError(new Anthropic.APIConnectionTimeoutError()).kind).toBe("timeout");
    expect(toAnalysisError(new Anthropic.APIConnectionError({})).kind).toBe("network");
  });

  it("maps a stream that breaks off partway to network", () => {
    expect(toAnalysisError(new Anthropic.AnthropicError("stream ended")).kind).toBe("network");
  });

  it("passes AnalysisErrors through unchanged", () => {
    const original = new AnalysisError("refusal", "x");
    expect(toAnalysisError(original)).toBe(original);
  });

  it("never includes the API key in the error message", () => {
    const key = "sk-ant-api03-secret";
    const error = toAnalysisError(
      Anthropic.APIError.generate(401, { message: `bad key ${key}` }, `bad key ${key}`, undefined),
    );
    expect(error.message).not.toContain(key);
  });
});
