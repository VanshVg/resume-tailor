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
}

function TextField({ label, hint, value, onChange, status, placeholder }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-900">
          {label}
        </label>
        <span className="text-xs text-slate-500" aria-live="off">
          {value.length.toLocaleString("en-US")} characters
        </span>
      </div>
      <p id={`${id}-hint`} className="text-xs text-slate-600">
        {hint}
      </p>
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

interface InputPanelProps {
  readonly resume: string;
  readonly onResumeChange: (value: string) => void;
  readonly resumeStatus: FieldStatus;
  readonly jobDescription: string;
  readonly onJobDescriptionChange: (value: string) => void;
  readonly jobDescriptionStatus: FieldStatus;
  readonly sizeStatus: FieldStatus;
}

export function InputPanel(props: InputPanelProps) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <TextField
          label="Your resume"
          hint="Paste it as plain text."
          value={props.resume}
          onChange={props.onResumeChange}
          status={props.resumeStatus}
          placeholder="Jane Doe — Software Engineer…"
        />
        <TextField
          label="Job description"
          hint="Paste the full posting, including requirements."
          value={props.jobDescription}
          onChange={props.onJobDescriptionChange}
          status={props.jobDescriptionStatus}
          placeholder="We're hiring a Senior TypeScript Engineer…"
        />
      </div>
      <FieldMessage id="input-size-status" status={props.sizeStatus} />
      <p className="mt-2 text-xs text-slate-600">
        Both texts are sent to Anthropic for analysis. Don&apos;t paste anything you wouldn&apos;t
        want sent to an AI provider (you may want to remove your phone number and address).
      </p>
    </div>
  );
}
