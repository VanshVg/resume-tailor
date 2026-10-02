import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { AnalysisProvider, AnalysisRequest, CoverLetterRequest } from "./services/provider";
import { validAnalysis } from "./test/fixtures";
import { LIMITS } from "./utils/validateInputs";

const resume = "Jane Doe. TypeScript developer. ".repeat(10);
const jobDescription = "Senior TypeScript engineer wanted. ".repeat(5);

const letter = "Dear Hiring Manager,\n\nI build TypeScript apps.\n\nSincerely,\nJane Doe";

function fakeProvider(): AnalysisProvider & {
  requests: AnalysisRequest[];
  letterRequests: CoverLetterRequest[];
} {
  const requests: AnalysisRequest[] = [];
  const letterRequests: CoverLetterRequest[] = [];
  const usage = { inputTokens: 3000, outputTokens: 1500 };
  return {
    requests,
    letterRequests,
    analyze(request) {
      requests.push(request);
      const text = JSON.stringify(validAnalysis);
      request.onText(text);
      return Promise.resolve({ text, usage });
    },
    draftCoverLetter(request) {
      letterRequests.push(request);
      request.onText(letter);
      return Promise.resolve({ text: letter, usage });
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

  it("saves analyses to history only when opted in, and can reopen and delete them", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);
    const historySection = screen.getByRole("region", { name: /Saved analyses/ });

    await user.type(screen.getByLabelText("Anthropic API key"), "sk-ant-test");
    await user.click(screen.getByRole("radio", { name: "Paste text" }));
    await user.click(screen.getByLabelText("Resume text"));
    await user.paste(resume);
    await user.click(screen.getByLabelText("Job description"));
    await user.paste(jobDescription);

    // Off by default: a run leaves nothing behind.
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await screen.findByText(validAnalysis.summary);
    expect(within(historySection).queryByRole("listitem")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Save analyses on this device"));
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    const item = await within(historySection).findByRole("listitem");
    expect(item).toHaveTextContent("Senior TypeScript Engineer at Acme");
    expect(item).toHaveTextContent("72");
    expect(localStorage.getItem("resume-tailor:history")).not.toContain("Jane Doe");

    await user.click(within(item).getByRole("button", { name: /View analysis/ }));
    expect(screen.getByRole("heading", { name: "Saved analysis" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to current analysis" }));
    expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument();

    await user.click(within(item).getByRole("button", { name: /Delete analysis/ }));
    expect(within(historySection).queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("asks before turning history off, since that deletes it", async () => {
    localStorage.setItem("resume-tailor:history-enabled", "true");
    localStorage.setItem(
      "resume-tailor:history",
      JSON.stringify([
        {
          id: "a",
          createdAt: "2026-10-02T10:00:00.000Z",
          modelId: "claude-sonnet-5-5",
          analysis: validAnalysis,
          jobDescription: "x",
          spend: { usage: { inputTokens: 1, outputTokens: 1 }, cost: 0.01 },
        },
      ]),
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);

    await user.click(screen.getByLabelText("Save analyses on this device"));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Save analyses on this device")).toBeChecked();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("drafts an editable cover letter from the analysed resume", async () => {
    const user = userEvent.setup();
    const provider = fakeProvider();
    render(<App provider={provider} />);

    await user.type(screen.getByLabelText("Anthropic API key"), "sk-ant-test");
    await user.click(screen.getByRole("radio", { name: "Paste text" }));
    await user.click(screen.getByLabelText("Resume text"));
    await user.paste(resume);
    await user.click(screen.getByLabelText("Job description"));
    await user.paste(jobDescription);
    await user.click(screen.getByRole("button", { name: "Analyze" }));
    await screen.findByText(validAnalysis.summary);

    // Editing the resume afterwards must not change what the letter is based on.
    await user.type(screen.getByLabelText("Resume text"), " edited later");
    await user.click(screen.getByRole("button", { name: "Draft a cover letter" }));

    const editor = await screen.findByLabelText(/Edit freely/);
    expect(editor).toHaveValue(letter);
    expect(provider.letterRequests[0]?.input).toMatchObject({
      resume: { kind: "text", text: resume },
      jobDescription,
      analysis: validAnalysis,
    });

    await user.type(editor, " P.S.");
    expect(editor).toHaveValue(`${letter} P.S.`);
    expect(screen.getByRole("button", { name: "Copy cover letter" })).toBeInTheDocument();

    // Regenerating asks before discarding edits.
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(provider.letterRequests).toHaveLength(1);
    expect(editor).toHaveValue(`${letter} P.S.`);
  });

  it("explains why a saved analysis can't get a cover letter without a resume", async () => {
    localStorage.setItem("resume-tailor:history-enabled", "true");
    localStorage.setItem(
      "resume-tailor:history",
      JSON.stringify([
        {
          id: "a",
          createdAt: "2026-10-02T10:00:00.000Z",
          modelId: "claude-sonnet-5-5",
          analysis: validAnalysis,
          jobDescription: "x",
          spend: { usage: { inputTokens: 1, outputTokens: 1 }, cost: 0.01 },
        },
      ]),
    );
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);

    await user.click(screen.getByRole("button", { name: /View analysis/ }));
    expect(screen.getByRole("button", { name: "Draft a cover letter" })).toBeDisabled();
    expect(screen.getByText(/Saved analyses don't store your resume/)).toBeInTheDocument();
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
