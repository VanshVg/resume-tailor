import type { FieldStatus } from "../utils/validateInputs";

interface FieldMessageProps {
  readonly id: string;
  readonly status: FieldStatus;
}

export function FieldMessage({ id, status }: FieldMessageProps) {
  if (!status) return null;
  const color = status.level === "error" ? "text-red-700" : "text-amber-800";
  return (
    <p id={id} className={`mt-1 text-sm ${color}`}>
      {status.message}
    </p>
  );
}
