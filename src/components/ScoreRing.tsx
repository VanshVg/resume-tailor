export type ScoreTone = "good" | "mid" | "bad";

export function scoreBand(score: number): {
  tone: ScoreTone;
  label: string;
  text: string;
  stroke: string;
} {
  if (score >= 75)
    return {
      tone: "good",
      label: "Strong match",
      text: "text-good-text",
      stroke: "stroke-emerald-500",
    };
  if (score >= 50)
    return {
      tone: "mid",
      label: "Partial match",
      text: "text-mid-text",
      stroke: "stroke-amber-500",
    };
  return { tone: "bad", label: "Weak match", text: "text-danger-text", stroke: "stroke-red-500" };
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The match score as a ring, with a text label so colour isn't the only cue. */
export function ScoreRing({ score }: { readonly score: number }) {
  const band = scoreBand(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        role="meter"
        aria-label="Match score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-valuetext={`${score} out of 100, ${band.label.toLowerCase()}`}
        className="relative size-28"
      >
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            className="stroke-sunken"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            className={band.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span className="text-fg text-3xl font-semibold tracking-tight tabular-nums">
            {score}
            <span className="text-fg-subtle text-sm font-medium">/100</span>
          </span>
        </span>
      </div>
      <span className={`text-sm font-semibold ${band.text}`}>{band.label}</span>
    </div>
  );
}
