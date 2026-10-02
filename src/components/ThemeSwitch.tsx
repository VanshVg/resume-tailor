import type { ThemePreference } from "../hooks/useTheme";
import { MonitorIcon, MoonIcon, SunIcon } from "./ui/icons";
import { Segmented, type SegmentedOption } from "./ui/Segmented";

const OPTIONS: readonly SegmentedOption<ThemePreference>[] = [
  { value: "system", label: "System theme", icon: <MonitorIcon />, iconOnly: true },
  { value: "light", label: "Light theme", icon: <SunIcon />, iconOnly: true },
  { value: "dark", label: "Dark theme", icon: <MoonIcon />, iconOnly: true },
];

interface ThemeSwitchProps {
  readonly value: ThemePreference;
  readonly onChange: (value: ThemePreference) => void;
}

export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  return <Segmented legend="Theme" options={OPTIONS} value={value} onChange={onChange} size="sm" />;
}
