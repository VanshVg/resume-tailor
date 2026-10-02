import type { ThemePreference } from "../hooks/useTheme";
import { ThemeSwitch } from "./ThemeSwitch";
import { ClockIcon, KeyIcon, LogoIcon } from "./ui/icons";

interface TopBarProps {
  readonly theme: ThemePreference;
  readonly onThemeChange: (value: ThemePreference) => void;
  readonly keyConnected: boolean;
  readonly onOpenSettings: () => void;
  /** Number of saved analyses, or null when history is off. */
  readonly savedCount: number | null;
  readonly onOpenHistory: () => void;
}

export function TopBar({
  theme,
  onThemeChange,
  keyConnected,
  onOpenSettings,
  savedCount,
  onOpenHistory,
}: TopBarProps) {
  return (
    <header className="border-line bg-surface/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <span className="bg-accent text-on-accent grid size-8 place-items-center rounded-lg">
            <LogoIcon className="size-5" />
          </span>
          <span className="text-fg font-semibold tracking-tight">Resume Tailor</span>
        </div>
        <nav aria-label="App" className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={onOpenHistory} className="btn-ghost">
            <ClockIcon />
            <span className="sr-only sm:not-sr-only">Saved</span>
            {savedCount !== null && savedCount > 0 && (
              <span className="bg-sunken text-fg-muted rounded-full px-1.5 text-xs tabular-nums">
                {savedCount}
              </span>
            )}
          </button>
          <button type="button" onClick={onOpenSettings} className="btn-ghost">
            <span className="relative">
              <KeyIcon />
              <span
                className={`ring-surface absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ${
                  keyConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="sr-only sm:not-sr-only">API key</span>
            <span className="sr-only">{keyConnected ? "(connected)" : "(not set)"}</span>
          </button>
          <ThemeSwitch value={theme} onChange={onThemeChange} />
        </nav>
      </div>
    </header>
  );
}
