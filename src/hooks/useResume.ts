import { useCallback, useState } from "react";
import { z } from "zod";
import type { PdfResume, ResumeInput } from "../types/resume";
import { readItem, removeItem, STORAGE_KEYS, writeItem } from "../utils/storage";

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

/** localStorage is ~5 MB per site; leave room for history and the key. */
export const MAX_SAVED_PDF_BYTES = 2 * 1024 * 1024;

const SavedPdfSchema = z.object({
  fileName: z.string(),
  base64: z.string(),
  sizeBytes: z.number(),
});

/** Stored data is untrusted too (old versions, manual edits), so validate it. */
function loadSavedPdf(): PdfResume | null {
  const raw = readItem(STORAGE_KEYS.resumePdf);
  if (raw === null) return null;
  try {
    const parsed = SavedPdfSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function initialDraft(text: string | null, pdf: PdfResume | null): ResumeDraft {
  return { mode: pdf || !text ? "file" : "text", text: text ?? "", pdf };
}

export interface UseResume {
  readonly draft: ResumeDraft;
  readonly setMode: (mode: ResumeMode) => void;
  readonly setText: (text: string) => void;
  readonly setPdf: (pdf: PdfResume | null) => void;
  /** Whether the resume is saved on this device (opt-in). */
  readonly remember: boolean;
  readonly setRemember: (value: boolean) => void;
  /** Explains why something couldn't be saved; null when all is well. */
  readonly saveWarning: string | null;
  /** Empties both tabs and deletes anything saved. */
  readonly clear: () => void;
}

export function useResume(): UseResume {
  const [saved] = useState(() => ({
    text: readItem(STORAGE_KEYS.resumeText),
    pdf: loadSavedPdf(),
  }));
  const [draft, setDraft] = useState<ResumeDraft>(() => initialDraft(saved.text, saved.pdf));
  const [remember, setRememberState] = useState(saved.text !== null || saved.pdf !== null);
  const [textWarning, setTextWarning] = useState<string | null>(null);
  const [pdfWarning, setPdfWarning] = useState<string | null>(null);

  const saveText = useCallback((text: string) => {
    const ok = text
      ? writeItem(STORAGE_KEYS.resumeText, text)
      : removeItem(STORAGE_KEYS.resumeText);
    setTextWarning(
      ok || !text
        ? null
        : "This browser wouldn't save your resume text, so it will be forgotten when you close the tab.",
    );
  }, []);

  const savePdf = useCallback((pdf: PdfResume | null) => {
    if (pdf === null) {
      removeItem(STORAGE_KEYS.resumePdf);
      setPdfWarning(null);
      return;
    }
    if (pdf.sizeBytes > MAX_SAVED_PDF_BYTES) {
      removeItem(STORAGE_KEYS.resumePdf);
      setPdfWarning(
        `This PDF is too large to save on this device (limit ${MAX_SAVED_PDF_BYTES / 1024 / 1024} MB), so it will be forgotten when you close the tab.`,
      );
      return;
    }
    const ok = writeItem(STORAGE_KEYS.resumePdf, JSON.stringify(pdf));
    setPdfWarning(
      ok
        ? null
        : "This browser wouldn't save your PDF (storage may be full or blocked), so it will be forgotten when you close the tab.",
    );
  }, []);

  const setMode = useCallback((mode: ResumeMode) => {
    setDraft((d) => ({ ...d, mode }));
  }, []);

  const setText = useCallback(
    (text: string) => {
      setDraft((d) => ({ ...d, text }));
      if (remember) saveText(text);
    },
    [remember, saveText],
  );

  const setPdf = useCallback(
    (pdf: PdfResume | null) => {
      setDraft((d) => ({ ...d, pdf }));
      if (remember) savePdf(pdf);
    },
    [remember, savePdf],
  );

  const setRemember = useCallback(
    (value: boolean) => {
      setRememberState(value);
      if (value) {
        saveText(draft.text);
        savePdf(draft.pdf);
      } else {
        removeItem(STORAGE_KEYS.resumeText);
        removeItem(STORAGE_KEYS.resumePdf);
        setTextWarning(null);
        setPdfWarning(null);
      }
    },
    [draft.text, draft.pdf, saveText, savePdf],
  );

  const clear = useCallback(() => {
    setDraft((d) => ({ ...d, text: "", pdf: null }));
    removeItem(STORAGE_KEYS.resumeText);
    removeItem(STORAGE_KEYS.resumePdf);
    setTextWarning(null);
    setPdfWarning(null);
  }, []);

  return {
    draft,
    setMode,
    setText,
    setPdf,
    remember,
    setRemember,
    saveWarning: pdfWarning ?? textWarning,
    clear,
  };
}
