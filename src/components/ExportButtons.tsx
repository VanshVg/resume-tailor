import { useState } from "react";
import type { Analysis } from "../schemas/analysis";
import { markdownFileName, toMarkdown, type MarkdownMeta } from "../utils/toMarkdown";
import { CopyButton } from "./CopyButton";

interface ExportButtonsProps {
  readonly analysis: Analysis;
  readonly meta: MarkdownMeta;
}

export function ExportButtons({ analysis, meta }: ExportButtonsProps) {
  const [failed, setFailed] = useState(false);
  const markdown = toMarkdown(analysis, meta);

  function download() {
    try {
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = markdownFileName(analysis, meta.date);
      link.click();
      // Give the browser a moment to start the download before freeing it.
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={download} className="btn-secondary px-2 py-1 text-xs">
        Download .md
      </button>
      <CopyButton text={markdown} label="Copy as Markdown" idleText="Copy as Markdown" />
      {failed && <span className="text-danger-text text-xs">Download failed; try copying.</span>}
    </div>
  );
}
