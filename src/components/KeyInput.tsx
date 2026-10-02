import { useId, useState } from "react";
import type { FieldStatus } from "../utils/validateInputs";
import { FieldMessage } from "./FieldMessage";

interface KeyInputProps {
  readonly apiKey: string;
  readonly onApiKeyChange: (value: string) => void;
  readonly remember: boolean;
  readonly onRememberChange: (value: boolean) => void;
  readonly onClear: () => void;
  readonly storageFailed: boolean;
  readonly status: FieldStatus;
}

export function KeyInput({
  apiKey,
  onApiKeyChange,
  remember,
  onRememberChange,
  onClear,
  storageFailed,
  status,
}: KeyInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={`${id}-key`} className="block text-sm font-medium text-slate-900">
        Anthropic API key
      </label>
      <div className="mt-1 flex flex-wrap gap-2">
        <input
          id={`${id}-key`}
          type={visible ? "text" : "password"}
          value={apiKey}
          onChange={(e) => {
            onApiKeyChange(e.target.value);
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-..."
          aria-describedby={`${id}-note ${id}-status`}
          className="input min-w-48 flex-1 font-mono"
        />
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v);
          }}
          aria-pressed={visible}
          className="btn-secondary"
        >
          {visible ? "Hide" : "Show"}
        </button>
        <button type="button" onClick={onClear} disabled={!apiKey} className="btn-secondary">
          Clear key
        </button>
      </div>
      <FieldMessage id={`${id}-status`} status={status} />
      <p id={`${id}-note`} className="mt-1 text-sm text-slate-600">
        Your key stays in your browser and is sent only to Anthropic. It is never stored on our
        servers. Get one at{" "}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          console.anthropic.com
        </a>
        .
      </p>
      <label className="mt-2 flex items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => {
            onRememberChange(e.target.checked);
          }}
          className="size-4 accent-indigo-600"
        />
        Remember my key on this device
      </label>
      {remember && !storageFailed && (
        <p className="mt-1 text-xs text-slate-600">
          Saved in this browser&apos;s local storage. Untick or press Clear key to remove it.
        </p>
      )}
      {storageFailed && (
        <p className="mt-1 text-sm text-amber-800">
          This browser blocked local storage, so the key will be forgotten when you close the tab.
        </p>
      )}
    </div>
  );
}
