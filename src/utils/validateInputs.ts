export const LIMITS = {
  /** Below this, there isn't enough to analyze meaningfully. */
  minResumeChars: 200,
  minJobDescriptionChars: 100,
  /** Above this we warn: slower, pricier, and usually means extra pasted junk. */
  combinedWarnChars: 30_000,
} as const;

export type FieldStatus = { readonly level: "error" | "warning"; readonly message: string } | null;

export interface InputCheck {
  readonly apiKey: FieldStatus;
  readonly resume: FieldStatus;
  readonly jobDescription: FieldStatus;
  readonly size: FieldStatus;
  /** Why Analyze is disabled, in order; empty when it can run. */
  readonly blockers: readonly string[];
}

export interface Inputs {
  readonly apiKey: string;
  readonly resume: string;
  readonly jobDescription: string;
}

function tooShort(text: string, min: number, what: string): FieldStatus {
  const length = text.trim().length;
  if (length === 0 || length >= min) return null;
  return {
    level: "error",
    message: `This looks too short to be a full ${what} (${length} of at least ${min} characters).`,
  };
}

export function checkInputs({ apiKey, resume, jobDescription }: Inputs): InputCheck {
  const key = apiKey.trim();
  const keyStatus: FieldStatus =
    key.length > 0 && !key.startsWith("sk-ant-")
      ? {
          level: "warning",
          message: "This doesn't look like an Anthropic API key (they start with sk-ant-).",
        }
      : null;

  const resumeStatus = tooShort(resume, LIMITS.minResumeChars, "resume");
  const jobStatus = tooShort(jobDescription, LIMITS.minJobDescriptionChars, "job description");

  const combined = resume.trim().length + jobDescription.trim().length;
  const sizeStatus: FieldStatus =
    combined > LIMITS.combinedWarnChars
      ? {
          level: "warning",
          message: `That's ${combined.toLocaleString("en-US")} characters combined. Over ${LIMITS.combinedWarnChars.toLocaleString("en-US")} the analysis gets slower and costs more; consider trimming anything that isn't the resume or the job posting.`,
        }
      : null;

  const blockers: string[] = [];
  if (key.length === 0) blockers.push("Enter your Anthropic API key.");
  if (resume.trim().length === 0) blockers.push("Paste your resume.");
  else if (resumeStatus) blockers.push("Your resume is too short.");
  if (jobDescription.trim().length === 0) blockers.push("Paste the job description.");
  else if (jobStatus) blockers.push("The job description is too short.");

  return {
    apiKey: keyStatus,
    resume: resumeStatus,
    jobDescription: jobStatus,
    size: sizeStatus,
    blockers,
  };
}
