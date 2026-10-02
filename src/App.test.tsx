import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import type { AnalysisProvider, AnalysisRequest } from "./services/provider";
import { validAnalysis } from "./test/fixtures";
import { LIMITS } from "./utils/validateInputs";

const resume = "Jane Doe. TypeScript developer. ".repeat(10);
const jobDescription = "Senior TypeScript engineer wanted. ".repeat(5);

function fakeProvider(): AnalysisProvider & { requests: AnalysisRequest[] } {
  const requests: AnalysisRequest[] = [];
  return {
    requests,
    analyze(request) {
      requests.push(request);
      const text = JSON.stringify(validAnalysis);
      request.onText(text);
      return Promise.resolve({ text, usage: { inputTokens: 3000, outputTokens: 1500 } });
    },
  };
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps Analyze disabled until key, resume and job description are present", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);
    const analyze = screen.getByRole("button", { name: "Analyze" });

    expect(analyze).toBeDisabled();
    await user.type(screen.getByLabelText("Anthropic API key"), "sk-ant-test");
    await user.click(screen.getByRole("radio", { name: "Paste text" }));
    await user.click(screen.getByLabelText("Resume text"));
    await user.paste(resume);
    expect(analyze).toBeDisabled();
    await user.click(screen.getByLabelText("Job description"));
    await user.paste(jobDescription);
    expect(analyze).toBeEnabled();
  });

  it("runs an analysis end to end and shows the results", async () => {
    expect(resume.trim().length).toBeGreaterThanOrEqual(LIMITS.minResumeChars);
    const user = userEvent.setup();
    const provider = fakeProvider();
    render(<App provider={provider} />);

    await user.type(screen.getByLabelText("Anthropic API key"), "sk-ant-test");
    await user.click(screen.getByRole("radio", { name: "Paste text" }));
    await user.click(screen.getByLabelText("Resume text"));
    await user.paste(resume);
    await user.click(screen.getByLabelText("Job description"));
    await user.paste(jobDescription);
    await user.click(screen.getByLabelText(/Claude Haiku 4.5/));
    await user.click(screen.getByRole("button", { name: "Analyze" }));

    expect(await screen.findByText(validAnalysis.summary)).toBeInTheDocument();
    expect(provider.requests[0]?.model.id).toBe("claude-haiku-4-5");
    expect(provider.requests[0]?.apiKey).toBe("sk-ant-test");
  });

  it("analyzes an uploaded PDF resume", async () => {
    const user = userEvent.setup();
    const provider = fakeProvider();
    render(<App provider={provider} />);

    await user.type(screen.getByLabelText("Anthropic API key"), "sk-ant-test");
    await user.click(screen.getByLabelText("Job description"));
    await user.paste(jobDescription);
    const pdf = new File([new TextEncoder().encode("%PDF-1.7 resume")], "cv.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText(/Choose a file/), pdf);

    expect(await screen.findByText("cv.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await screen.findByText(validAnalysis.summary);
    expect(provider.requests[0]?.input.resume).toMatchObject({ kind: "pdf", fileName: "cv.pdf" });
  });

  it("loads a .txt resume into the text box for review", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);

    await user.upload(screen.getByLabelText(/Choose a file/), new File([resume], "cv.txt"));

    expect(await screen.findByLabelText("Resume text")).toHaveValue(resume);
    expect(screen.getByRole("radio", { name: "Paste text" })).toBeChecked();
  });

  it("does not store the key unless asked to", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);
    await user.type(screen.getByLabelText("Anthropic API key"), "sk-ant-test");
    expect(Object.keys(localStorage)).toHaveLength(0);

    await user.click(screen.getByLabelText("Remember my key on this device"));
    expect(Object.keys(localStorage)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear key" }));
    expect(Object.keys(localStorage)).toHaveLength(0);
    expect(screen.getByLabelText("Anthropic API key")).toHaveValue("");
  });
});
