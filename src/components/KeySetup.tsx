import { useState } from "react";
import { checkInputs } from "../utils/validateInputs";
import { KeyInput } from "./KeyInput";
import { KeyPrivacyNote } from "./KeyPrivacyNote";
import { KeyIcon } from "./ui/icons";

interface KeySetupProps {
  readonly onSave: (key: string, remember: boolean) => void;
}

/** First-run card. Once a key is saved it's managed from the top bar instead. */
export function KeySetup({ onSave }: KeySetupProps) {
  const [draft, setDraft] = useState("");
  const [remember, setRemember] = useState(false);
  const status = checkInputs({
    apiKey: draft,
    resume: { mode: "text", text: "", pdf: null },
    jobDescription: "",
  }).apiKey;

  return (
    <section aria-labelledby="key-setup-heading" className="card p-5">
      <div className="flex items-start gap-3">
        <span className="bg-info-bg text-accent-fg grid size-9 shrink-0 place-items-center rounded-lg">
          <KeyIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="key-setup-heading" className="text-fg font-semibold">
            Connect your Anthropic API key
          </h2>
          <p className="text-fg-muted mt-0.5 text-sm">
            Analyses run on your own key, so you only pay for what you use (about 2–5 cents each).
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) onSave(draft.trim(), remember);
            }}
          >
            <KeyInput value={draft} onChange={setDraft} status={status} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-fg flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => {
                    setRemember(e.target.checked);
                  }}
                  className="accent-accent size-4"
                />
                Remember my key on this device
              </label>
              <button type="submit" disabled={!draft.trim()} className="btn-primary">
                Save key
              </button>
            </div>
            <KeyPrivacyNote />
          </form>
        </div>
      </div>
    </section>
  );
}
