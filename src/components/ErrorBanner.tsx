import type { Spend } from "../hooks/useAnalysis";
import { describeError } from "../services/errors";
import type { AnalysisErrorKind } from "../services/provider";
import { SpendNote } from "./SpendNote";

interface ErrorBannerProps {
  readonly kind: AnalysisErrorKind;
  readonly partialText: string;
  readonly spend: Spend | null;
  readonly onRetry: () => void;
  readonly onDismiss: () => void;
}

export function ErrorBanner({ kind, partialText, spend, onRetry, onDismiss }: ErrorBannerProps) {
  const { title, message, retryable } = describeError(kind);
  const isCancel = kind === "cancelled";
  const tone = isCancel
    ? "border-line-strong bg-sunken text-fg"
    : "border-danger-line bg-danger-bg text-danger-fg";

  return (
    <div role={isCancel ? "status" : "alert"} className={`rounded-lg border p-4 ${tone}`}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm">{message}</p>
      {spend && (
        <div className="mt-2">
          <SpendNote spend={spend} prefix="Tokens used before this stopped cost" />
        </div>
      )}
      {partialText && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">
            Show what was received ({partialText.length.toLocaleString("en-US")} characters)
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-surface/70 p-2 text-xs whitespace-pre-wrap">
            {partialText}
          </pre>
        </details>
      )}
      <div className="mt-3 flex gap-2">
        {retryable && (
          <button type="button" onClick={onRetry} className="btn-primary">
            Try again
          </button>
        )}
        <button type="button" onClick={onDismiss} className="btn-secondary">
          Dismiss
        </button>
      </div>
    </div>
  );
}
