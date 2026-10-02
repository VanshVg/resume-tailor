import type { ReactNode } from "react";
import { getModelLabel } from "../config/models";
import type { Spend } from "../hooks/useAnalysis";
import type { Analysis, Importance } from "../schemas/analysis";
import { BulletRewrite } from "./BulletRewrite";
import { SpendNote } from "./SpendNote";

interface ResultViewProps {
  readonly analysis: Analysis;
  /** A string, so saved history entries for retired models still render. */
  readonly modelId: string;
  readonly spend: Spend;
}

function scoreBand(score: number): { label: string; color: string; bar: string } {
  if (score >= 75) return { label: "Strong match", color: "text-good-text", bar: "bg-emerald-600" };
  if (score >= 50) return { label: "Partial match", color: "text-mid-text", bar: "bg-amber-500" };
  return { label: "Weak match", color: "text-danger-text", bar: "bg-red-600" };
}

const IMPORTANCE_STYLES: Record<Importance, string> = {
  high: "bg-bad-soft text-bad-soft-fg",
  medium: "bg-mid-soft text-mid-soft-fg",
  low: "bg-sunken text-fg-muted",
};

function Section({
  title,
  count,
  children,
}: {
  readonly title: string;
  readonly count: number;
  readonly children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold text-fg">
        {title} <span className="text-sm font-normal text-fg-subtle">({count})</span>
      </h3>
      {count === 0 ? <p className="mt-2 text-sm text-fg-subtle">None.</p> : children}
    </section>
  );
}

function TextList({ items }: { readonly items: readonly string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ResultView({ analysis, modelId, spend }: ResultViewProps) {
  const band = scoreBand(analysis.matchScore);

  return (
    <article aria-label="Analysis results">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center sm:w-36">
          <p className={`text-5xl font-bold ${band.color}`}>
            {analysis.matchScore}
            <span className="text-xl font-medium text-fg-subtle">/100</span>
          </p>
          <p className={`text-sm font-medium ${band.color}`}>{band.label}</p>
          <div
            className="mt-2 h-2 rounded-full bg-line"
            role="meter"
            aria-label="Match score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={analysis.matchScore}
          >
            <div
              className={`h-2 rounded-full ${band.bar}`}
              style={{ width: `${analysis.matchScore}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-fg-subtle">
            {analysis.jobTitle}
            {analysis.company && <> at {analysis.company}</>}
          </p>
          <p className="mt-1 text-fg">{analysis.summary}</p>
          <div className="mt-2">
            <SpendNote spend={spend} prefix={`Analyzed by ${getModelLabel(modelId)} for`} />
          </div>
        </div>
      </div>

      <Section title="Strengths" count={analysis.strengths.length}>
        <TextList items={analysis.strengths} />
      </Section>

      <Section title="Missing keywords" count={analysis.missingKeywords.length}>
        <ul className="mt-2 space-y-2">
          {analysis.missingKeywords.map((item, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-fg">{item.keyword}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${IMPORTANCE_STYLES[item.importance]}`}
                >
                  {item.importance} importance
                </span>
              </div>
              <p className="mt-1 text-fg-muted">{item.suggestion}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Bullet rewrites" count={analysis.bulletRewrites.length}>
        <ul className="mt-2 space-y-3">
          {analysis.bulletRewrites.map((rewrite, i) => (
            <BulletRewrite key={i} rewrite={rewrite} />
          ))}
        </ul>
      </Section>

      <Section title="Section advice" count={analysis.sectionAdvice.length}>
        <dl className="mt-2 space-y-2 text-sm">
          {analysis.sectionAdvice.map((item, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface p-3">
              <dt className="font-medium text-fg">{item.section}</dt>
              <dd className="mt-1 text-fg-muted">{item.advice}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Gaps" count={analysis.gaps.length}>
        <p className="mt-1 text-sm text-fg-muted">
          Requirements your resume doesn&apos;t show. Only add them if you genuinely have the
          experience.
        </p>
        <TextList items={analysis.gaps} />
      </Section>

      <Section title="Cover letter points" count={analysis.coverLetterPoints.length}>
        <TextList items={analysis.coverLetterPoints} />
      </Section>
    </article>
  );
}
