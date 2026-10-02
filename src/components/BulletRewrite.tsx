import type { BulletRewrite as BulletRewriteData } from "../schemas/analysis";
import { CopyButton } from "./CopyButton";

interface BulletRewriteProps {
  readonly rewrite: BulletRewriteData;
}

export function BulletRewrite({ rewrite }: BulletRewriteProps) {
  return (
    <li className="rounded-lg border border-line bg-surface p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">Original</p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-fg-muted">{rewrite.original}</p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-good-text uppercase">Improved</p>
            <CopyButton text={rewrite.improved} label="Copy improved bullet" />
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap text-fg">{rewrite.improved}</p>
        </div>
      </div>
      <p className="mt-2 border-t border-line-subtle pt-2 text-sm text-fg-muted">
        <span className="font-medium">Why: </span>
        {rewrite.reason}
      </p>
    </li>
  );
}
