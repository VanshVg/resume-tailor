import type { ReactNode } from "react";
import { formatCost, getModelLabel } from "../config/models";
import type { Spend } from "../hooks/useAnalysis";
import type { Analysis, Importance } from "../schemas/analysis";
import { BulletRewrite } from "./BulletRewrite";
import { ExportButtons } from "./ExportButtons";
import { ScoreRing } from "./ScoreRing";
import { SpendNote } from "./SpendNote";
import { AlertIcon, ListIcon, MailIcon, PenIcon, TargetIcon, ThumbIcon } from "./ui/icons";

interface ResultViewProps {
  readonly analysis: Analysis;
  /** A string, so saved history entries for retired models still render. */
  readonly modelId: string;
  readonly spend: Spend;
  /** When the analysis was made (for the export header and file name). */
  readonly createdAt: Date;
  /** Rendered inside the cover letter section (the drafting panel). */
  readonly coverLetter?: ReactNode;
}

const IMPORTANCE_ORDER: readonly Importance[] = ["high", "medium", "low"];

const IMPORTANCE_STYLES: Record<Importance, string> = {
  high: "bg-bad-soft text-bad-soft-fg",
  medium: "bg-mid-soft text-mid-soft-fg",
  low: "bg-sunken text-fg-muted",
};

const SECTIONS = [
  { id: "keywords", label: "Keywords" },
  { id: "rewrites", label: "Rewrites" },
  { id: "fit", label: "Strengths & gaps" },
  { id: "advice", label: "Advice" },
  { id: "cover-letter", label: "Cover letter" },
] as const;

function Section({
  id,
  icon,
  title,
  count,
  description,
  children,
}: {
  readonly id: string;
  readonly icon: ReactNode;
  readonly title: string;
  readonly count?: number;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="card scroll-mt-32 p-5">
      <div className="flex items-start gap-3">
        <span className="bg-sunken text-fg-muted grid size-8 shrink-0 place-items-center rounded-lg">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 id={`${id}-heading`} className="text-fg font-semibold">
            {title}
            {count !== undefined && " "}
            {count !== undefined && (
              <span className="text-fg-subtle text-sm font-normal tabular-nums">({count})</span>
            )}
          </h3>
          {description && <p className="text-fg-muted text-sm">{description}</p>}
        </div>
      </div>
      <div className="mt-4">
        {count === 0 ? <p className="text-fg-subtle text-sm">Nothing to show here.</p> : children}
      </div>
    </section>
  );
}

function TextList({
  items,
  marker,
}: {
  readonly items: readonly string[];
  readonly marker: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-fg flex gap-2.5 text-sm">
          <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 rounded-full ${marker}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Stat({ value, label }: { readonly value: number; readonly label: string }) {
  return (
    <span className="bg-sunken text-fg-muted rounded-full px-2.5 py-1 text-xs">
      <span className="text-fg font-semibold tabular-nums">{value}</span> {label}
    </span>
  );
}

export function ResultView({ analysis, modelId, spend, createdAt, coverLetter }: ResultViewProps) {
  const keywords = [...analysis.missingKeywords].sort(
    (a, b) => IMPORTANCE_ORDER.indexOf(a.importance) - IMPORTANCE_ORDER.indexOf(b.importance),
  );

  return (
    <article aria-label="Analysis results" className="space-y-4">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ScoreRing score={analysis.matchScore} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Match for</p>
            <p className="text-fg text-lg font-semibold">
              {analysis.jobTitle}
              {analysis.company && (
                <span className="text-fg-muted font-normal"> at {analysis.company}</span>
              )}
            </p>
            <p className="text-fg mt-2">{analysis.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Stat value={analysis.strengths.length} label="strengths" />
              <Stat value={analysis.missingKeywords.length} label="missing keywords" />
              <Stat value={analysis.bulletRewrites.length} label="rewrites" />
              <Stat value={analysis.gaps.length} label="gaps" />
            </div>
          </div>
        </div>
        <div className="border-line mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <SpendNote spend={spend} prefix={`Analyzed by ${getModelLabel(modelId)} for`} />
          <ExportButtons
            analysis={analysis}
            meta={{
              modelLabel: getModelLabel(modelId),
              cost: formatCost(spend.cost),
              date: createdAt,
            }}
          />
        </div>
      </div>

      <nav
        aria-label="Result sections"
        className="bg-page/85 sticky top-14 z-10 -mx-4 overflow-x-auto px-4 py-2 backdrop-blur"
      >
        <ul className="flex gap-1.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="border-line bg-surface text-fg-muted hover:text-fg hover:border-line-strong focus-visible:outline-focus block rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-2"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section
        id="keywords"
        icon={<TargetIcon />}
        title="Missing keywords"
        count={keywords.length}
        description="Important terms from the posting that your resume doesn't use yet."
      >
        <ul className="divide-line-subtle divide-y">
          {keywords.map((item, i) => (
            <li
              key={i}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4"
            >
              <div className="flex shrink-0 items-center gap-2 sm:w-56">
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase ${IMPORTANCE_STYLES[item.importance]}`}
                >
                  {item.importance}
                  <span className="sr-only"> importance</span>
                </span>
                <span className="text-fg text-sm font-medium">{item.keyword}</span>
              </div>
              <p className="text-fg-muted text-sm">{item.suggestion}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="rewrites"
        icon={<PenIcon />}
        title="Bullet rewrites"
        count={analysis.bulletRewrites.length}
        description="Your existing bullets, reworded for this role. No new facts added."
      >
        <ul className="space-y-3">
          {analysis.bulletRewrites.map((rewrite, i) => (
            <BulletRewrite key={i} rewrite={rewrite} />
          ))}
        </ul>
      </Section>

      <div id="fit" className="grid scroll-mt-32 gap-4 md:grid-cols-2">
        <Section
          id="strengths"
          icon={<ThumbIcon />}
          title="Strengths"
          count={analysis.strengths.length}
          description="Already a good match."
        >
          <TextList items={analysis.strengths} marker="bg-emerald-500" />
        </Section>
        <Section
          id="gaps"
          icon={<AlertIcon />}
          title="Gaps"
          count={analysis.gaps.length}
          description="Not shown in your resume. Only add these if you really have the experience."
        >
          <TextList items={analysis.gaps} marker="bg-amber-500" />
        </Section>
      </div>

      <Section
        id="advice"
        icon={<ListIcon />}
        title="Section advice"
        count={analysis.sectionAdvice.length}
      >
        <dl className="divide-line-subtle divide-y">
          {analysis.sectionAdvice.map((item, i) => (
            <div
              key={i}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4"
            >
              <dt className="text-fg shrink-0 text-sm font-medium sm:w-40">{item.section}</dt>
              <dd className="text-fg-muted text-sm">{item.advice}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="cover-letter" icon={<MailIcon />} title="Cover letter">
        <p className="eyebrow">Points worth emphasizing</p>
        <div className="mt-2">
          {analysis.coverLetterPoints.length === 0 ? (
            <p className="text-fg-subtle text-sm">None suggested.</p>
          ) : (
            <TextList items={analysis.coverLetterPoints} marker="bg-accent" />
          )}
        </div>
        {coverLetter && <div className="border-line mt-5 border-t pt-5">{coverLetter}</div>}
      </Section>
    </article>
  );
}
