import { useId, type ReactNode } from "react";

export interface SegmentedOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
  readonly icon?: ReactNode;
  /** Show only the icon; the label becomes the accessible name. */
  readonly iconOnly?: boolean;
}

interface SegmentedProps<Value extends string> {
  /** Accessible name for the group. */
  readonly legend: string;
  readonly options: readonly SegmentedOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly size?: "sm" | "md";
}

/** A radio group styled as a segmented control; arrow keys work natively. */
export function Segmented<Value extends string>({
  legend,
  options,
  value,
  onChange,
  size = "md",
}: SegmentedProps<Value>) {
  const name = useId();
  const pad = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="border-line bg-sunken inline-flex rounded-lg border p-0.5">
        {options.map((option) => (
          <label
            key={option.value}
            title={option.iconOnly ? option.label : undefined}
            className={`text-fg-muted hover:text-fg has-checked:bg-raised has-checked:text-fg has-focus-visible:outline-focus flex cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium transition-colors has-checked:shadow-sm has-focus-visible:outline-2 ${pad}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              aria-label={option.iconOnly ? option.label : undefined}
              className="sr-only"
            />
            {option.icon}
            {!option.iconOnly && option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
