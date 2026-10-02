import type { ThemePreference } from "../hooks/useTheme";

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

interface ThemeSwitchProps {
  readonly value: ThemePreference;
  readonly onChange: (value: ThemePreference) => void;
}

export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">Theme</legend>
      <span aria-hidden="true" className="text-fg-subtle text-xs">
        Theme
      </span>
      <div className="border-line-strong bg-sunken inline-flex rounded-lg border p-0.5">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="text-fg-muted has-checked:bg-surface has-checked:text-fg has-focus-visible:outline-focus cursor-pointer rounded-md px-2 py-0.5 text-xs has-checked:font-medium has-checked:shadow-sm has-focus-visible:outline-2"
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
