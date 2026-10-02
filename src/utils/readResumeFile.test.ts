import { describe, expect, it } from "vitest";
import { bytesToBase64, MAX_PDF_BYTES, readResumeFile, type ReadResult } from "./readResumeFile";

const pdfBytes = new TextEncoder().encode("%PDF-1.7\nfake pdf body");

function expectError(result: ReadResult, text: string) {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toContain(text);
}

function file(parts: BlobPart[], name: string, type = ""): File {
  return new File(parts, name, { type });
}

describe("readResumeFile", () => {
  it("reads a PDF as base64", async () => {
    const result = await readResumeFile(file([pdfBytes], "cv.pdf", "application/pdf"));
    expect(result).toEqual({
      ok: true,
      kind: "pdf",
      pdf: { fileName: "cv.pdf", base64: bytesToBase64(pdfBytes), sizeBytes: pdfBytes.length },
    });
  });

  it("rejects a .pdf that isn't really a PDF", async () => {
    const result = await readResumeFile(file(["hello"], "cv.pdf"));
    expectError(result, "valid PDF");
  });

  it("rejects PDFs over the size limit", async () => {
    const big = new Uint8Array(MAX_PDF_BYTES + 1);
    const result = await readResumeFile(file([big], "cv.pdf"));
    expectError(result, "limit");
  });

  it.each(["cv.txt", "cv.md"])("reads %s as text", async (name) => {
    const result = await readResumeFile(file(["Jane Doe\nEngineer"], name));
    expect(result).toEqual({ ok: true, kind: "text", text: "Jane Doe\nEngineer" });
  });

  it("explains that Word files need exporting to PDF", async () => {
    const result = await readResumeFile(file(["x"], "cv.docx"));
    expectError(result, "Export");
  });

  it("rejects other file types", async () => {
    const result = await readResumeFile(file(["x"], "photo.png", "image/png"));
    expectError(result, "Unsupported");
  });
});

describe("bytesToBase64", () => {
  it("matches btoa for small input", () => {
    expect(bytesToBase64(new TextEncoder().encode("hello"))).toBe(btoa("hello"));
  });

  it("handles input larger than one chunk", () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256);
    const decoded = Uint8Array.from(atob(bytesToBase64(bytes)), (c) => c.charCodeAt(0));
    expect(decoded).toEqual(bytes);
  });
});
