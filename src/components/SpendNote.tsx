import { formatCost } from "../config/models";
import type { Spend } from "../hooks/useAnalysis";

export function SpendNote({ spend, prefix }: { readonly spend: Spend; readonly prefix: string }) {
  const { inputTokens, outputTokens } = spend.usage;
  return (
    <p className="text-xs text-fg-muted">
      {prefix} {formatCost(spend.cost)} ({inputTokens.toLocaleString("en-US")} input +{" "}
      {outputTokens.toLocaleString("en-US")} output tokens, including thinking), billed to your key.
    </p>
  );
}
