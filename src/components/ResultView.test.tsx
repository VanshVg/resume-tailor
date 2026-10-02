import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { validAnalysis } from "../test/fixtures";
import { ResultView } from "./ResultView";

const date = new Date("2026-10-02T10:00:00Z");
const spend = { usage: { inputTokens: 3012, outputTokens: 2345 }, cost: 0.02947 };

describe("ResultView", () => {
  it("shows the match score prominently with a text label", () => {
    render(
      <ResultView
        analysis={validAnalysis}
        modelId="claude-sonnet-5-5"
        spend={spend}
        createdAt={date}
      />,
    );
    expect(screen.getByRole("meter", { name: "Match score" })).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
    expect(screen.getByText("Partial match")).toBeInTheDocument();
  });

  it("shows the job title and company", () => {
    render(
      <ResultView
        analysis={validAnalysis}
        modelId="claude-sonnet-5-5"
        spend={spend}
        createdAt={date}
      />,
    );
    expect(screen.getByText("Senior TypeScript Engineer")).toBeInTheDocument();
    expect(screen.getByText("at Acme", { exact: false })).toBeInTheDocument();
  });

  it("shows the actual cost and model", () => {
    render(
      <ResultView
        analysis={validAnalysis}
        modelId="claude-sonnet-5-5"
        spend={spend}
        createdAt={date}
      />,
    );
    const note = screen.getByText(
      (_, el) => el?.tagName === "P" && /^Analyzed by/.test(el.textContent),
    );
    expect(note).toHaveTextContent(
      "Analyzed by Claude Sonnet 5.5 for $0.029 (3,012 in · 2,345 out)",
    );
  });

  it("renders sections with the most actionable first", () => {
    render(
      <ResultView
        analysis={validAnalysis}
        modelId="claude-sonnet-5-5"
        spend={spend}
        createdAt={date}
      />,
    );
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "Missing keywords (1)",
      "Bullet rewrites (1)",
      "Strengths (1)",
      "Gaps (1)",
      "Section advice (1)",
      "Cover letter",
    ]);
  });

  it("copies the improved bullet to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(
      <ResultView
        analysis={validAnalysis}
        modelId="claude-sonnet-5-5"
        spend={spend}
        createdAt={date}
      />,
    );

    const button = screen.getByRole("button", { name: "Copy improved bullet" });
    await user.click(button);

    expect(writeText).toHaveBeenCalledWith("Built a React UI used by 3 teams");
    expect(within(button).getByText("Copied!")).toBeInTheDocument();
  });

  it("copies the whole analysis as Markdown", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(
      <ResultView
        analysis={validAnalysis}
        modelId="claude-sonnet-5-5"
        spend={spend}
        createdAt={date}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy as Markdown" }));
    const copied = writeText.mock.calls[0]?.[0] ?? "";
    expect(copied).toMatch(/^# Resume analysis: Senior TypeScript Engineer at Acme/);
    expect(copied).toContain("2026-10-02 · Claude Sonnet 5.5 · $0.029");
  });

  it("downloads the analysis as a .md file", async () => {
    const user = userEvent.setup();
    // jsdom doesn't implement object URLs; stub them on a URL subclass.
    const createObjectURL = vi.fn(() => "blob:fake");
    vi.stubGlobal(
      "URL",
      class extends URL {
        static override createObjectURL = createObjectURL;
        static override revokeObjectURL = vi.fn();
      },
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe("senior-typescript-engineer-acme-2026-10-02.md");
      expect(this.href).toBe("blob:fake");
    });

    try {
      render(
        <ResultView
          analysis={validAnalysis}
          modelId="claude-sonnet-5-5"
          spend={spend}
          createdAt={date}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Download .md" }));
      expect(click).toHaveBeenCalledOnce();
      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("renders model output as text, never as HTML", () => {
    const hostile = { ...validAnalysis, summary: '<img src=x onerror="alert(1)">' };
    const { container } = render(
      <ResultView analysis={hostile} modelId="claude-sonnet-5-5" spend={spend} createdAt={date} />,
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
        createdAt={date}
      />,
    );
    expect(screen.getByRole("heading", { name: "Gaps (0)" })).toBeInTheDocument();
    expect(screen.getByText("Nothing to show here.")).toBeInTheDocument();
  });
});
