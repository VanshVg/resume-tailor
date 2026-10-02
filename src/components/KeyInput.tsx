import { useId, useState } from "react";
import type { FieldStatus } from "../utils/validateInputs";
import { FieldMessage } from "./FieldMessage";

interface KeyInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly status: FieldStatus;
}

/** A password field for the API key with a show/hide toggle. */
export function KeyInput({ value, onChange, status }: KeyInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="text-fg text-sm font-medium">
        Anthropic API key
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          aria-describedby={`${id}-status`}
          className="input min-w-0 flex-1 font-mono"
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
      </div>
      <FieldMessage id={`${id}-status`} status={status} />
    </div>
  );
}
