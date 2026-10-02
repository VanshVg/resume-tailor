import { useCallback, useEffect, useRef, useState } from "react";
import { calculateCost, getModel, type ModelId } from "../config/models";
import type { CoverLetterInput } from "../prompts/coverLetter";
import {
  asAnalysisError,
  type AnalysisErrorKind,
  type AnalysisProvider,
} from "../services/provider";
import type { Spend } from "./useAnalysis";

export interface CoverLetterParams {
  readonly apiKey: string;
  readonly modelId: ModelId;
  readonly input: CoverLetterInput;
}

export type CoverLetterState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "streaming"; readonly partialText: string }
  | { readonly status: "success"; readonly text: string; readonly spend: Spend }
  | {
      readonly status: "error";
      readonly kind: AnalysisErrorKind;
      readonly partialText: string;
      readonly spend: Spend | null;
    };

export interface UseCoverLetter {
  readonly state: CoverLetterState;
  readonly run: (params: CoverLetterParams) => void;
  readonly retry: () => void;
  readonly cancel: () => void;
  readonly reset: () => void;
}

const IDLE: CoverLetterState = { status: "idle" };

/**
 * Same lifecycle as useAnalysis, minus JSON validation: the letter is plain
 * text, so whatever streams in is the result.
 */
export function useCoverLetter(provider: AnalysisProvider): UseCoverLetter {
  const [state, setState] = useState<CoverLetterState>(IDLE);
  const controllerRef = useRef<AbortController | null>(null);
  const lastParamsRef = useRef<CoverLetterParams | null>(null);

  const execute = useCallback(
    async (params: CoverLetterParams, controller: AbortController) => {
      const model = getModel(params.modelId);
      const { signal } = controller;
      const update = (next: CoverLetterState) => {
        if (controllerRef.current === controller) setState(next);
      };

      let partialText = "";
      update({ status: "loading" });
      try {
        const response = await provider.draftCoverLetter({
          apiKey: params.apiKey,
          model,
          input: params.input,
          signal,
          onText: (chunk) => {
            partialText += chunk;
            update({ status: "streaming", partialText });
          },
        });
        update({
          status: "success",
          text: response.text.trim(),
          spend: { usage: response.usage, cost: calculateCost(model, response.usage) },
        });
      } catch (thrown) {
        const error = asAnalysisError(thrown, signal);
        if (error.kind !== "cancelled") {
          console.warn(`Cover letter failed: ${error.kind} (${error.message})`);
        }
        update({
          status: "error",
          kind: error.kind,
          partialText,
          spend: error.usage
            ? { usage: error.usage, cost: calculateCost(model, error.usage) }
            : null,
        });
      }
    },
    [provider],
  );

  const run = useCallback(
    (params: CoverLetterParams) => {
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
