import type {
  AnalysisProvider,
  AnalysisRequest,
  CoverLetterRequest,
  ProviderResponse,
} from "../services/provider";

type Step<Request> = (request: Request) => Promise<ProviderResponse>;

/**
 * A provider whose responses are scripted per call, recording every request.
 * Calls beyond the script fail the test loudly.
 */
export function scriptedProvider(
  analyzeSteps: Step<AnalysisRequest>[] = [],
  coverLetterSteps: Step<CoverLetterRequest>[] = [],
): AnalysisProvider & { calls: AnalysisRequest[]; letterCalls: CoverLetterRequest[] } {
  const calls: AnalysisRequest[] = [];
  const letterCalls: CoverLetterRequest[] = [];
  return {
    calls,
    letterCalls,
    analyze(request) {
      calls.push(request);
      const step = analyzeSteps[calls.length - 1];
      if (!step) throw new Error(`Unexpected analyze call #${calls.length}`);
      return step(request);
    },
    draftCoverLetter(request) {
      letterCalls.push(request);
      const step = coverLetterSteps[letterCalls.length - 1];
      if (!step) throw new Error(`Unexpected draftCoverLetter call #${letterCalls.length}`);
      return step(request);
    },
  };
}

/** Lets React render between steps, like real network latency would. */
export function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export const fakeUsage = { inputTokens: 3000, outputTokens: 1500 };

/** Streams `chunks` (default: the whole text at once), then resolves. */
export function respond<Request extends { onText: (chunk: string) => void }>(
  text: string,
  chunks = [text],
): Step<Request> {
  return async (request) => {
    await tick();
    for (const chunk of chunks) {
      request.onText(chunk);
      await tick();
    }
    return { text, usage: fakeUsage };
  };
}
