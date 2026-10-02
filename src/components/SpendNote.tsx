import { formatCost } from "../config/models";
import type { Spend } from "../hooks/useAnalysis";

export function SpendNote({ spend, prefix }: { readonly spend: Spend; readonly prefix: string }) {
  const { inputTokens, outputTokens } = spend.usage;
  return (
    <p className="text-fg-subtle text-xs">
      {prefix} <span className="text-fg-muted font-medium">{formatCost(spend.cost)}</span>{" "}
      <span title="Output includes the model's thinking tokens">
        ({inputTokens.toLocaleString("en-US")} in · {outputTokens.toLocaleString("en-US")} out)
      </span>
    </p>
  );
}
