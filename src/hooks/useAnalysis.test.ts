import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { validAnalysis } from "../test/fixtures";
import {
  AnalysisError,
  type AnalysisProvider,
  type AnalysisRequest,
  type AnalysisResponse,
} from "../services/provider";
import { useAnalysis, type AnalysisParams, type AnalysisState } from "./useAnalysis";

const params: AnalysisParams = {
  apiKey: "sk-ant-test",
  modelId: "claude-sonnet-5-5",
  input: { resume: { kind: "text", text: "resume" }, jobDescription: "job" },
};

const usage = { inputTokens: 3000, outputTokens: 1500 };
const validJson = JSON.stringify(validAnalysis);

/** A provider whose responses are scripted per call. */
function scriptedProvider(
  ...steps: ((request: AnalysisRequest) => Promise<AnalysisResponse>)[]
): AnalysisProvider & { calls: AnalysisRequest[] } {
  const calls: AnalysisRequest[] = [];
  return {
    calls,
    analyze(request) {
      calls.push(request);
      const step = steps[calls.length - 1];
      if (!step) throw new Error(`Unexpected call #${calls.length}`);
      return step(request);
    },
  };
}

/** Lets React render between steps, like real network latency would. */
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function respond(text: string, chunks = [text]) {
  return async (request: AnalysisRequest) => {
    await tick();
    for (const chunk of chunks) {
      request.onText(chunk);
      await tick();
    }
    return { text, usage };
  };
}

function fail(error: AnalysisError) {
  return () => Promise.reject(error);
}

/** Never resolves until aborted, then rejects the way the SDK does. */
function hang(request: AnalysisRequest): Promise<AnalysisResponse> {
  request.onText('{"matchScore":');
  return new Promise((_resolve, reject) => {
    request.signal.addEventListener("abort", () => {
      reject(new Error("aborted"));
    });
  });
}

function setup(provider: AnalysisProvider) {
  const statuses: AnalysisState["status"][] = [];
  const hook = renderHook(() => {
    const result = useAnalysis(provider);
    statuses.push(result.state.status);
    return result;
  });
  return { ...hook, statuses };
}

describe("useAnalysis", () => {
  it("starts idle", () => {
    const { result } = setup(scriptedProvider());
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("goes loading → streaming → success with cost from usage", async () => {
    const provider = scriptedProvider(
      respond(validJson, [validJson.slice(0, 10), validJson.slice(10)]),
    );
    const { result, statuses } = setup(provider);

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("success");
    });

    expect(statuses).toEqual(expect.arrayContaining(["idle", "loading", "streaming", "success"]));
    expect(result.current.state).toEqual({
      status: "success",
      analysis: validAnalysis,
      modelId: "claude-sonnet-5-5",
      spend: { usage, cost: expect.closeTo(0.021, 5) as number },
    });
    expect(provider.calls[0]?.model.id).toBe("claude-sonnet-5-5");
  });

  it("calls onSuccess once with the result and the request params", async () => {
    const onSuccess = vi.fn();
    const provider = scriptedProvider(respond(validJson));
    const { result } = renderHook(() => useAnalysis(provider, { onSuccess }));

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("success");
    });

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ analysis: validAnalysis, modelId: "claude-sonnet-5-5", params }),
    );
  });

  it("retries once automatically when the output is invalid, adding up the cost", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const provider = scriptedProvider(respond("not json"), respond(validJson));
    const { result } = setup(provider);

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("success");
    });

    expect(provider.calls).toHaveLength(2);
    expect(warn).toHaveBeenCalledOnce();
    if (result.current.state.status !== "success") throw new Error("expected success");
    expect(result.current.state.spend.usage).toEqual({ inputTokens: 6000, outputTokens: 3000 });
  });

  it("reports invalid_output after the retry also fails, keeping the text", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const bad = JSON.stringify({ ...validAnalysis, matchScore: 500 });
    const { result } = setup(scriptedProvider(respond("garbage"), respond(bad)));

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });

    expect(result.current.state).toMatchObject({
      status: "error",
      kind: "invalid_output",
      partialText: bad,
    });
  });

  it("does not retry provider errors, and reports their kind", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const provider = scriptedProvider(fail(new AnalysisError("rate_limit", "429")));
    const { result } = setup(provider);

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });

    expect(provider.calls).toHaveLength(1);
    expect(result.current.state).toMatchObject({ kind: "rate_limit", spend: null });
  });

  it("keeps partial text and billed usage when the stream is interrupted", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const provider = scriptedProvider((request) => {
      request.onText('{"matchScore": 70, "summ');
      return Promise.reject(new AnalysisError("truncated", "max_tokens", usage));
    });
    const { result } = setup(provider);

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });

    expect(result.current.state).toMatchObject({
      kind: "truncated",
      partialText: '{"matchScore": 70, "summ',
      spend: { usage },
    });
  });

  it("cancels an in-flight request", async () => {
    const provider = scriptedProvider(hang);
    const { result } = setup(provider);

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("streaming");
    });
    act(() => {
      result.current.cancel();
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });

    expect(provider.calls[0]?.signal.aborted).toBe(true);
    expect(result.current.state).toMatchObject({
      kind: "cancelled",
      partialText: '{"matchScore":',
    });
  });

  it("retry re-runs the last request", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const provider = scriptedProvider(
      fail(new AnalysisError("overloaded", "529")),
      respond(validJson),
    );
    const { result } = setup(provider);

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("success");
    });

    expect(provider.calls[1]?.input).toEqual(params.input);
  });

  it("ignores updates from a run that was replaced", async () => {
    let resolveFirst: (value: AnalysisResponse) => void = () => undefined;
    const provider = scriptedProvider(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      respond(validJson),
    );
    const { result } = setup(provider);

    act(() => {
      result.current.run(params);
    });
    act(() => {
      result.current.run({ ...params, modelId: "claude-opus-5-5" });
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("success");
    });
    await act(async () => {
      resolveFirst({ text: "garbage", usage });
      await Promise.resolve();
    });

    expect(result.current.state).toMatchObject({ status: "success", modelId: "claude-opus-5-5" });
  });
});
