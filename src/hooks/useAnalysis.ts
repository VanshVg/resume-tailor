import { useCallback, useEffect, useRef, useState } from "react";
import { addUsage, calculateCost, getModel, type ModelId, type TokenUsage } from "../config/models";
import type { AnalyzeInput } from "../prompts/analyze";
import { AnalysisSchema, type Analysis } from "../schemas/analysis";
import {
  asAnalysisError,
  type AnalysisErrorKind,
  type AnalysisProvider,
} from "../services/provider";
import { parseJson } from "../utils/parseJson";

/** Attempts per run: one automatic retry if the output fails validation. */
const MAX_ATTEMPTS = 2;

export interface AnalysisParams {
  readonly apiKey: string;
  readonly modelId: ModelId;
  readonly input: AnalyzeInput;
}

export interface Spend {
  readonly usage: TokenUsage;
  /** USD, from the token counts the API reported. */
  readonly cost: number;
}

export type AnalysisState =
  | { readonly status: "idle" }
  /** Request sent; nothing received yet (the model may be thinking). */
  | { readonly status: "loading"; readonly attempt: number }
  | { readonly status: "streaming"; readonly attempt: number; readonly partialText: string }
  | {
      readonly status: "success";
      readonly analysis: Analysis;
      readonly modelId: ModelId;
      readonly spend: Spend;
    }
  | {
      readonly status: "error";
      readonly kind: AnalysisErrorKind;
      /** Whatever streamed in before the failure, so it isn't lost. */
      readonly partialText: string;
      readonly spend: Spend | null;
    };

export interface AnalysisSuccess {
  readonly analysis: Analysis;
  readonly modelId: ModelId;
  readonly spend: Spend;
  readonly params: AnalysisParams;
}

export interface UseAnalysisOptions {
  /** Called once per successful run (not for runs that were replaced). */
  readonly onSuccess?: (result: AnalysisSuccess) => void;
}

export interface UseAnalysis {
  readonly state: AnalysisState;
  readonly run: (params: AnalysisParams) => void;
  readonly retry: () => void;
  readonly cancel: () => void;
  readonly reset: () => void;
}

const IDLE: AnalysisState = { status: "idle" };

export function useAnalysis(
  provider: AnalysisProvider,
  { onSuccess }: UseAnalysisOptions = {},
): UseAnalysis {
  const [state, setState] = useState<AnalysisState>(IDLE);
  const controllerRef = useRef<AbortController | null>(null);
  const lastParamsRef = useRef<AnalysisParams | null>(null);
  // Kept in a ref so a new callback each render doesn't restart anything.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const execute = useCallback(
    async (params: AnalysisParams, controller: AbortController) => {
      const model = getModel(params.modelId);
      const { signal } = controller;
      // Ignore late updates from a run that has been cancelled or replaced.
      const update = (next: AnalysisState) => {
        if (controllerRef.current === controller) setState(next);
      };

      let usage: TokenUsage | null = null;
      const spend = (): Spend | null =>
        usage === null ? null : { usage, cost: calculateCost(model, usage) };
      const addSpend = (more: TokenUsage | undefined) => {
        if (more) usage = usage === null ? more : addUsage(usage, more);
      };

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        let partialText = "";
        update({ status: "loading", attempt });

        try {
          const response = await provider.analyze({
            apiKey: params.apiKey,
            model,
            input: params.input,
            signal,
            onText: (chunk) => {
              partialText += chunk;
              update({ status: "streaming", attempt, partialText });
            },
          });
          addSpend(response.usage);

          const parsed = parseJson(response.text, AnalysisSchema);
          if (parsed.ok) {
            const total = spend();
            if (total === null) throw new Error("unreachable: usage recorded above");
            update({
              status: "success",
              analysis: parsed.data,
              modelId: params.modelId,
              spend: total,
            });
            if (controllerRef.current === controller) {
              onSuccessRef.current?.({
                analysis: parsed.data,
                modelId: params.modelId,
                spend: total,
                params,
              });
            }
            return;
          }

          // Logged for debugging. Contains no API key, only parse issues.
          console.warn(
            `Analysis output failed validation (attempt ${attempt}/${MAX_ATTEMPTS}, ${parsed.reason}): ${parsed.issues}`,
          );
          if (attempt === MAX_ATTEMPTS) {
            update({ status: "error", kind: "invalid_output", partialText, spend: spend() });
            return;
          }
        } catch (thrown) {
          const error = asAnalysisError(thrown, signal);
          addSpend(error.usage);
          if (error.kind !== "cancelled") {
            console.warn(`Analysis failed: ${error.kind} (${error.message})`);
          }
          update({ status: "error", kind: error.kind, partialText, spend: spend() });
          return;
        }
      }
    },
    [provider],
  );

  const run = useCallback(
    (params: AnalysisParams) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      lastParamsRef.current = params;
      void execute(params, controller);
    },
    [execute],
  );

  const retry = useCallback(() => {
    if (lastParamsRef.current) run(lastParamsRef.current);
  }, [run]);

  const cancel = useCallback(() => {
    // Abort the request; the run itself reports the "cancelled" state, keeping
    // any partial text it had received.
    controllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(IDLE);
  }, []);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  return { state, run, retry, cancel, reset };
}
