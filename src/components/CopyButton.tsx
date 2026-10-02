import { useEffect, useState } from "react";

interface CopyButtonProps {
  readonly text: string;
  /** Accessible name, e.g. "Copy improved bullet". */
  readonly label: string;
  /** Visible text before copying. */
  readonly idleText?: string;
}

type CopyStatus = "idle" | "copied" | "failed";

export function CopyButton({ text, label, idleText = "Copy" }: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => {
      setStatus("idle");
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      // Clipboard can be unavailable (insecure context, denied permission).
      setStatus("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void copy();
      }}
      aria-label={label}
      className="btn-secondary shrink-0 px-2 py-1 text-xs"
    >
      <span aria-live="polite">
        {status === "copied" ? "Copied!" : status === "failed" ? "Copy failed" : idleText}
      </span>
    </button>
  );
}
