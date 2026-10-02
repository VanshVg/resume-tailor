import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
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

const savedEntry = {
  id: "a",
  createdAt: "2026-10-02T10:00:00.000Z",
  modelId: "claude-sonnet-5-5",
  analysis: validAnalysis,
  jobDescription: "x",
  spend: { usage: { inputTokens: 1, outputTokens: 1 }, cost: 0.01 },
};

const textbox = (name: string) => screen.getByRole("textbox", { name });

/** Password inputs have no textbox role, so find the key field by its label. */
const keyField = () => screen.getByLabelText("Anthropic API key");

async function connectKey(user: UserEvent, key = "sk-ant-test") {
  await user.type(keyField(), key);
  await user.click(screen.getByRole("button", { name: "Save key" }));
}

async function pasteResume(user: UserEvent, text = resume) {
  await user.click(screen.getByRole("radio", { name: "Paste" }));
  await user.click(textbox("Resume text"));
  await user.paste(text);
}

async function pasteJob(user: UserEvent) {
  await user.click(textbox("Job description"));
  await user.paste(jobDescription);
}

async function analyzeWithText(user: UserEvent) {
  await connectKey(user);
  await pasteResume(user);
  await pasteJob(user);
  await user.click(screen.getByRole("button", { name: /Analyze/ }));
  await screen.findByText(validAnalysis.summary);
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("asks for a key first, then manages it from the top bar", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);

    expect(screen.getByRole("heading", { name: "Connect your Anthropic API key" })).toBeVisible();
    await connectKey(user);
    expect(
      screen.queryByRole("heading", { name: "Connect your Anthropic API key" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /API key/ }));
    const dialog = screen.getByRole("dialog", { name: "API key" });
    expect(within(dialog).getByLabelText("Anthropic API key")).toHaveValue("sk-ant-test");
    await user.click(within(dialog).getByRole("button", { name: "Remove key" }));
    expect(screen.getByRole("heading", { name: "Connect your Anthropic API key" })).toBeVisible();
  });

  it("does not store the key unless asked to", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);
    await connectKey(user);
    expect(Object.keys(localStorage)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /API key/ }));
    await user.click(screen.getByLabelText("Remember my key on this device"));
    expect(localStorage.getItem("resume-tailor:anthropic-api-key")).toBe("sk-ant-test");

    await user.click(screen.getByRole("button", { name: "Remove key" }));
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it("can remember the key from the first-run setup", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);
    await user.type(keyField(), "sk-ant-keep");
    await user.click(screen.getByLabelText("Remember my key on this device"));
    await user.click(screen.getByRole("button", { name: "Save key" }));
    expect(localStorage.getItem("resume-tailor:anthropic-api-key")).toBe("sk-ant-keep");
  });

  it("keeps Analyze disabled, saying what's missing, until everything is present", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);
    const analyze = screen.getByRole("button", { name: /Analyze/ });

    expect(analyze).toBeDisabled();
    expect(analyze).toHaveAccessibleDescription("Enter your Anthropic API key.");
    await connectKey(user);
    expect(analyze).toHaveAccessibleDescription("Upload your resume.");
    await pasteResume(user);
    expect(analyze).toHaveAccessibleDescription("Paste the job description.");
    await pasteJob(user);
    expect(analyze).toBeEnabled();
  });

  it("runs an analysis end to end and shows the results", async () => {
    expect(resume.trim().length).toBeGreaterThanOrEqual(LIMITS.minResumeChars);
    const user = userEvent.setup();
    const provider = fakeProvider();
    render(<App provider={provider} />);

    await user.selectOptions(screen.getByLabelText("Model"), "claude-haiku-4-5");
    await analyzeWithText(user);

    expect(screen.getByRole("meter", { name: "Match score" })).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
    expect(provider.requests[0]?.model.id).toBe("claude-haiku-4-5");
    expect(provider.requests[0]?.apiKey).toBe("sk-ant-test");
  });

  it("analyzes an uploaded PDF resume", async () => {
    const user = userEvent.setup();
    const provider = fakeProvider();
    render(<App provider={provider} />);

    await connectKey(user);
    await pasteJob(user);
    const pdf = new File([new TextEncoder().encode("%PDF-1.7 resume")], "cv.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText(/Choose a file/), pdf);

    expect(await screen.findByText("cv.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Analyze/ }));
    await screen.findByText(validAnalysis.summary);
    expect(provider.requests[0]?.input.resume).toMatchObject({ kind: "pdf", fileName: "cv.pdf" });
  });

  it("loads a .txt resume into the text box for review", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);

    await user.upload(screen.getByLabelText(/Choose a file/), new File([resume], "cv.txt"));

    expect(await screen.findByRole("textbox", { name: "Resume text" })).toHaveValue(resume);
    expect(screen.getByRole("radio", { name: "Paste" })).toBeChecked();
  });

  it("saves analyses to history only when opted in, and can reopen and delete them", async () => {
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);
    const openHistory = () => user.click(screen.getByRole("button", { name: /Saved/ }));

    // Off by default: a run leaves nothing behind.
    await analyzeWithText(user);
    await openHistory();
    let drawer = screen.getByRole("dialog", { name: "Saved analyses" });
    expect(within(drawer).queryByRole("listitem")).not.toBeInTheDocument();

    await user.click(within(drawer).getByLabelText("Save analyses on this device"));
    await user.click(within(drawer).getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: /Analyze/ }));
    await openHistory();
    drawer = screen.getByRole("dialog", { name: "Saved analyses" });
    const item = await within(drawer).findByRole("listitem");
    expect(item).toHaveTextContent("Senior TypeScript Engineer at Acme");
    expect(item).toHaveTextContent("72");
    expect(localStorage.getItem("resume-tailor:history")).not.toContain("Jane Doe");

    await user.click(within(item).getByRole("button", { name: /View analysis/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saved analysis" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to current analysis" }));
    expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument();

    await openHistory();
    drawer = screen.getByRole("dialog", { name: "Saved analyses" });
    await user.click(within(drawer).getByRole("button", { name: /Delete analysis/ }));
    expect(within(drawer).queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("asks before turning history off, since that deletes it", async () => {
    localStorage.setItem("resume-tailor:history-enabled", "true");
    localStorage.setItem("resume-tailor:history", JSON.stringify([savedEntry]));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);

    await user.click(screen.getByRole("button", { name: /Saved/ }));
    const drawer = screen.getByRole("dialog", { name: "Saved analyses" });
    await user.click(within(drawer).getByLabelText("Save analyses on this device"));
    expect(confirm).toHaveBeenCalledOnce();
    expect(within(drawer).getByLabelText("Save analyses on this device")).toBeChecked();
    expect(within(drawer).getAllByRole("listitem")).toHaveLength(1);
  });

  it("drafts an editable cover letter from the analysed resume", async () => {
    const user = userEvent.setup();
    const provider = fakeProvider();
    render(<App provider={provider} />);
    await analyzeWithText(user);

    // Editing the resume afterwards must not change what the letter is based on.
    await user.type(textbox("Resume text"), " edited later");
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
    localStorage.setItem("resume-tailor:history", JSON.stringify([savedEntry]));
    const user = userEvent.setup();
    render(<App provider={fakeProvider()} />);

    await user.click(screen.getByRole("button", { name: /Saved/ }));
    await user.click(screen.getByRole("button", { name: /View analysis/ }));
    expect(screen.getByRole("button", { name: "Draft a cover letter" })).toBeDisabled();
    expect(screen.getByText(/Saved analyses don't store your resume/)).toBeInTheDocument();
  });
});
