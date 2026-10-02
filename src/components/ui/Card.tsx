import type { ReactNode } from "react";

interface StepCardProps {
  readonly step: number;
  readonly title: string;
  /** Id for the heading, so the body can reference it. */
  readonly headingId: string;
  /** Controls on the right of the header (e.g. a segmented switch). */
  readonly actions?: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

/** A numbered input card: header, body, and an optional quiet footer. */
export function StepCard({ step, title, headingId, actions, footer, children }: StepCardProps) {
  return (
    <section aria-labelledby={headingId} className="card flex min-w-0 flex-col">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5">
        <h2 id={headingId} className="text-fg flex items-center gap-2.5 font-semibold">
          <span className="bg-sunken text-fg-muted grid size-6 place-items-center rounded-full text-xs tabular-nums">
            {step}
          </span>
          {title}
        </h2>
        {actions}
      </div>
      <div className="flex-1 px-4 pb-3">{children}</div>
      {footer && (
        <div className="border-line text-fg-muted flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-4 py-2 text-xs">
          {footer}
        </div>
      )}
    </section>
  );
}
