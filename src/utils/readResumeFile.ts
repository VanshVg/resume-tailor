import type { PdfResume } from "../types/resume";

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_FILE_BYTES = 1024 * 1024;

export type ReadResult =
  | { readonly ok: true; readonly kind: "pdf"; readonly pdf: PdfResume }
  | { readonly ok: true; readonly kind: "text"; readonly text: string }
  | { readonly ok: false; readonly error: string };

/** The accept attribute for the file input. */
export const ACCEPTED_FILE_TYPES = ".pdf,.txt,.md,application/pdf,text/plain,text/markdown";

function extension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** btoa needs a binary string; build it in chunks to avoid call-stack limits. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function looksLikePdf(bytes: Uint8Array): boolean {
  return PDF_MAGIC.every((byte, i) => bytes[i] === byte);
}

/** Reads a resume file chosen by the user. Never throws. */
export async function readResumeFile(file: File): Promise<ReadResult> {
  const ext = extension(file.name);

  if (ext === "doc" || ext === "docx") {
    return {
      ok: false,
      error: "Word files aren't supported. Export your resume as a PDF and upload that instead.",
    };
  }

  try {
    if (ext === "pdf" || file.type === "application/pdf") {
      if (file.size > MAX_PDF_BYTES) {
        return {
          ok: false,
          error: `That PDF is ${formatMb(file.size)}. The limit is ${formatMb(MAX_PDF_BYTES)}; try exporting it without images.`,
        };
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!looksLikePdf(bytes)) {
        return { ok: false, error: "That file doesn't look like a valid PDF." };
      }
      return {
        ok: true,
        kind: "pdf",
        pdf: { fileName: file.name, base64: bytesToBase64(bytes), sizeBytes: file.size },
      };
    }

    if (ext === "txt" || ext === "md" || file.type.startsWith("text/")) {
      if (file.size > MAX_TEXT_FILE_BYTES) {
        return { ok: false, error: "That text file is too large to be a resume." };
      }
      return { ok: true, kind: "text", text: await file.text() };
    }
  } catch {
    return { ok: false, error: "Couldn't read that file. Try choosing it again." };
  }

  return { ok: false, error: "Unsupported file type. Upload a PDF, .txt or .md file." };
}
