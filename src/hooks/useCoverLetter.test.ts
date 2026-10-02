import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalysisError } from "../services/provider";
import { fakeUsage, respond, scriptedProvider } from "../test/fakeProvider";
import { validAnalysis } from "../test/fixtures";
import { useCoverLetter, type CoverLetterParams } from "./useCoverLetter";

const params: CoverLetterParams = {
  apiKey: "sk-ant-test",
  modelId: "claude-haiku-4-5",
  input: {
    resume: { kind: "text", text: "Jane Doe" },
    jobDescription: "Engineer",
    analysis: validAnalysis,
  },
};

describe("useCoverLetter", () => {
  it("streams the letter and reports its cost", async () => {
    const provider = scriptedProvider([], [respond("  Dear Hiring Manager, …  ", ["Dear ", "…"])]);
    const { result } = renderHook(() => useCoverLetter(provider));

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("success");
    });

    expect(result.current.state).toEqual({
      status: "success",
      text: "Dear Hiring Manager, …",
      // Haiku: 3000 × $1/MTok + 1500 × $5/MTok
      spend: { usage: fakeUsage, cost: 0.0105 },
    });
    expect(provider.letterCalls[0]?.model.id).toBe("claude-haiku-4-5");
    expect(provider.letterCalls[0]?.input).toBe(params.input);
  });

  it("reports provider errors with their kind and billed usage", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const provider = scriptedProvider(
      [],
      [() => Promise.reject(new AnalysisError("refusal", "refused", fakeUsage))],
    );
    const { result } = renderHook(() => useCoverLetter(provider));

    act(() => {
      result.current.run(params);
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });
    expect(result.current.state).toMatchObject({ kind: "refusal", spend: { usage: fakeUsage } });
  });

  it("can be cancelled", async () => {
    const provider = scriptedProvider(
      [],
      [
        (request) =>
          new Promise((_resolve, reject) => {
            request.signal.addEventListener("abort", () => {
              reject(new Error("aborted"));
            });
          }),
      ],
    );
    const { result } = renderHook(() => useCoverLetter(provider));

    act(() => {
      result.current.run(params);
    });
    act(() => {
      result.current.cancel();
    });
    await waitFor(() => {
      expect(result.current.state).toMatchObject({ status: "error", kind: "cancelled" });
    });
  });
});
