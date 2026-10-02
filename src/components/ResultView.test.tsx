import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { validAnalysis } from "../test/fixtures";
import { ResultView } from "./ResultView";

const spend = { usage: { inputTokens: 3012, outputTokens: 2345 }, cost: 0.02947 };

describe("ResultView", () => {
  it("shows the match score prominently with a text label", () => {
    render(<ResultView analysis={validAnalysis} modelId="claude-sonnet-5-5" spend={spend} />);
    expect(screen.getByRole("meter", { name: "Match score" })).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
    expect(screen.getByText("Partial match")).toBeInTheDocument();
  });

  it("shows the job title and company", () => {
    render(<ResultView analysis={validAnalysis} modelId="claude-sonnet-5-5" spend={spend} />);
    expect(screen.getByText("Senior TypeScript Engineer at Acme")).toBeInTheDocument();
  });

  it("shows the actual cost and model", () => {
    render(<ResultView analysis={validAnalysis} modelId="claude-sonnet-5-5" spend={spend} />);
    expect(screen.getByText(/Analyzed by Claude Sonnet 5.5 for \$0.029/)).toBeInTheDocument();
    expect(screen.getByText(/3,012 input \+ 2,345 output tokens/)).toBeInTheDocument();
  });

  it("renders sections in the specified order", () => {
    render(<ResultView analysis={validAnalysis} modelId="claude-sonnet-5-5" spend={spend} />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "Strengths (1)",
      "Missing keywords (1)",
      "Bullet rewrites (1)",
      "Section advice (1)",
      "Gaps (1)",
      "Cover letter points (1)",
    ]);
  });

  it("copies the improved bullet to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<ResultView analysis={validAnalysis} modelId="claude-sonnet-5-5" spend={spend} />);

    const button = screen.getByRole("button", { name: "Copy improved bullet" });
    await user.click(button);

    expect(writeText).toHaveBeenCalledWith("Built a React UI used by 3 teams");
    expect(within(button).getByText("Copied!")).toBeInTheDocument();
  });

  it("renders model output as text, never as HTML", () => {
    const hostile = { ...validAnalysis, summary: '<img src=x onerror="alert(1)">' };
    const { container } = render(
      <ResultView analysis={hostile} modelId="claude-sonnet-5-5" spend={spend} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
  });

  it("shows an empty state for empty sections", () => {
    render(
      <ResultView
        analysis={{ ...validAnalysis, gaps: [] }}
        modelId="claude-sonnet-5-5"
        spend={spend}
      />,
    );
    expect(screen.getByRole("heading", { name: "Gaps (0)" })).toBeInTheDocument();
    expect(screen.getByText("None.")).toBeInTheDocument();
  });
});
