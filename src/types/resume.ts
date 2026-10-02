export interface PdfResume {
  readonly fileName: string;
  /** Base64 of the file bytes, without a data: URL prefix. */
  readonly base64: string;
  readonly sizeBytes: number;
}

/**
 * What the user is analyzing. Pasted (or .txt/.md) text, or a PDF that is
 * sent to the model as-is, so no PDF parsing happens in the browser.
 */
export type ResumeInput =
  { readonly kind: "text"; readonly text: string } | ({ readonly kind: "pdf" } & PdfResume);
