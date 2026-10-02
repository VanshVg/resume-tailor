import { useId } from "react";
import type { FieldStatus } from "../utils/validateInputs";
import { FieldMessage } from "./FieldMessage";

interface TextFieldProps {
  readonly label: string;
  readonly hint: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly status: FieldStatus;
  readonly placeholder: string;
  /** Hide the label visually (e.g. when a surrounding fieldset already names it). */
  readonly labelHidden?: boolean;
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  status,
  placeholder,
  labelHidden = false,
}: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className={labelHidden ? "sr-only" : "text-fg text-sm font-medium"}>
        {label}
      </label>
      <div className="flex items-baseline justify-between gap-2">
        <p id={`${id}-hint`} className="text-fg-muted text-xs">
          {hint}
        </p>
        <span className="text-fg-subtle text-xs">
          {value.length.toLocaleString("en-US")} characters
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        rows={14}
        aria-invalid={status?.level === "error"}
        aria-describedby={`${id}-hint ${id}-status`}
        className="input mt-1 min-h-48 resize-y"
      />
      <FieldMessage id={`${id}-status`} status={status} />
    </div>
  );
}
