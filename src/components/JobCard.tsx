import { useId } from "react";
import type { FieldStatus } from "../utils/validateInputs";
import { FieldMessage } from "./FieldMessage";
import { StepCard } from "./ui/Card";

interface JobCardProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly status: FieldStatus;
}

export function JobCard({ value, onChange, status }: JobCardProps) {
  const id = useId();
  return (
    <StepCard
      step={2}
      title="Job description"
      headingId={`${id}-heading`}
      footer={
        <>
          <span>Include the requirements and responsibilities.</span>
          <span className="tabular-nums">{value.length.toLocaleString("en-US")} characters</span>
        </>
      }
    >
      <div className="h-72">
        <label htmlFor={id} className="sr-only">
          Job description
        </label>
        <textarea
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder="Paste the full job posting…"
          aria-invalid={status?.level === "error"}
          aria-describedby={`${id}-status`}
          className="input h-full w-full resize-none"
        />
      </div>
      <FieldMessage id={`${id}-status`} status={status} />
    </StepCard>
  );
}
