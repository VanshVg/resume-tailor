import type { BulletRewrite as BulletRewriteData } from "../schemas/analysis";
import { CopyButton } from "./CopyButton";
import { ArrowRightIcon } from "./ui/icons";

export function BulletRewrite({ rewrite }: { readonly rewrite: BulletRewriteData }) {
  return (
    <li className="border-line rounded-xl border">
      <div className="grid md:grid-cols-[1fr_auto_1fr]">
        <div className="p-3.5">
          <p className="eyebrow">Original</p>
          <p className="text-fg-muted mt-1 text-sm whitespace-pre-wrap">{rewrite.original}</p>
        </div>
        <div className="text-fg-subtle hidden items-center md:flex" aria-hidden="true">
          <ArrowRightIcon />
        </div>
        <div className="bg-good-soft/40 border-line border-t p-3.5 md:rounded-r-xl md:border-t-0 md:border-l">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-good-text">Improved</p>
            <CopyButton text={rewrite.improved} label="Copy improved bullet" />
          </div>
          <p className="text-fg mt-1 text-sm whitespace-pre-wrap">{rewrite.improved}</p>
        </div>
      </div>
      <p className="border-line text-fg-muted border-t px-3.5 py-2.5 text-xs">
        <span className="text-fg font-medium">Why: </span>
        {rewrite.reason}
      </p>
    </li>
  );
}
