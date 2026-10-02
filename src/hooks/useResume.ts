import { useCallback, useState } from "react";
import type { PdfResume, ResumeInput } from "../types/resume";

export type ResumeMode = "text" | "file";

/** Everything the resume field holds, including the tab not currently shown. */
export interface ResumeDraft {
  readonly mode: ResumeMode;
  readonly text: string;
  readonly pdf: PdfResume | null;
}

/** The resume to analyze, from whichever tab is active; null if it's empty. */
export function toResumeInput(draft: ResumeDraft): ResumeInput | null {
  if (draft.mode === "file") return draft.pdf ? { kind: "pdf", ...draft.pdf } : null;
  return draft.text.trim() ? { kind: "text", text: draft.text } : null;
}

export interface UseResume {
  readonly draft: ResumeDraft;
  readonly setMode: (mode: ResumeMode) => void;
  readonly setText: (text: string) => void;
  readonly setPdf: (pdf: PdfResume | null) => void;
}

export function useResume(): UseResume {
  const [draft, setDraft] = useState<ResumeDraft>({ mode: "file", text: "", pdf: null });

  const setMode = useCallback((mode: ResumeMode) => {
    setDraft((d) => ({ ...d, mode }));
  }, []);
  const setText = useCallback((text: string) => {
    setDraft((d) => ({ ...d, text }));
  }, []);
  const setPdf = useCallback((pdf: PdfResume | null) => {
    setDraft((d) => ({ ...d, pdf }));
  }, []);

  return { draft, setMode, setText, setPdf };
}
