import { describe, expect, it } from "vitest";
import { checkInputs, LIMITS } from "./validateInputs";

const ok = {
  apiKey: "sk-ant-api03-abc",
  resume: "r".repeat(LIMITS.minResumeChars),
  jobDescription: "j".repeat(LIMITS.minJobDescriptionChars),
};

describe("checkInputs", () => {
  it("allows a complete set of inputs", () => {
    const check = checkInputs(ok);
    expect(check.blockers).toEqual([]);
    expect([check.apiKey, check.resume, check.jobDescription, check.size]).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it("blocks empty inputs without flagging the fields as errors", () => {
    const check = checkInputs({ apiKey: " ", resume: "", jobDescription: "" });
    expect(check.blockers).toHaveLength(3);
    expect(check.resume).toBeNull();
  });

  it("blocks inputs that are too short to be meaningful", () => {
    const check = checkInputs({ ...ok, resume: "TypeScript dev" });
    expect(check.resume?.level).toBe("error");
    expect(check.blockers).toEqual(["Your resume is too short."]);
  });

  it("warns, but does not block, on a key that doesn't look like an Anthropic key", () => {
    const check = checkInputs({ ...ok, apiKey: "sk-openai-123" });
    expect(check.apiKey?.level).toBe("warning");
    expect(check.blockers).toEqual([]);
  });

  it("warns, but does not block, on oversized inputs", () => {
    const check = checkInputs({ ...ok, resume: "r".repeat(LIMITS.combinedWarnChars) });
    expect(check.size?.level).toBe("warning");
    expect(check.blockers).toEqual([]);
  });
});
