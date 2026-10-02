import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorBanner } from "./ErrorBanner";

function renderBanner(props: Partial<Parameters<typeof ErrorBanner>[0]> = {}) {
  const onRetry = vi.fn();
  const onDismiss = vi.fn();
  render(
    <ErrorBanner
      kind="rate_limit"
      partialText=""
      spend={null}
      onRetry={onRetry}
      onDismiss={onDismiss}
      {...props}
    />,
  );
  return { onRetry, onDismiss };
}

describe("ErrorBanner", () => {
  it("shows a human-readable message as an alert", () => {
    renderBanner({ kind: "rate_limit" });
    expect(screen.getByRole("alert")).toHaveTextContent("Rate limit reached");
    expect(screen.getByRole("alert")).toHaveTextContent(/try again/i);
  });

  it("offers a retry for retryable errors", async () => {
    const { onRetry } = renderBanner({ kind: "overloaded" });
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not offer a retry for a rejected key", () => {
    renderBanner({ kind: "invalid_key" });
    expect(screen.getByRole("alert")).toHaveTextContent("API key rejected");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("explains a refusal plainly", () => {
    renderBanner({ kind: "refusal" });
    expect(screen.getByRole("alert")).toHaveTextContent("The model declined this request");
  });

  it("keeps partial output available", async () => {
    renderBanner({ kind: "network", partialText: '{"matchScore": 70' });
    await userEvent.click(screen.getByText(/Show what was received/));
    expect(screen.getByText('{"matchScore": 70')).toBeVisible();
  });

  it("shows what the failed attempt cost", () => {
    renderBanner({
      kind: "truncated",
      spend: { usage: { inputTokens: 3000, outputTokens: 16000 }, cost: 0.166 },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("$0.166");
  });

  it("uses a calm status, not an alert, for a cancellation", () => {
    renderBanner({ kind: "cancelled" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cancelled");
  });
});
