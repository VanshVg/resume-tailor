import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  /** "dialog" is centred; "drawer" slides in from the right. */
  readonly variant?: "dialog" | "drawer";
  readonly children: ReactNode;
}

/**
 * A thin wrapper over the native <dialog> element, which provides focus
 * trapping, Esc to close, inert background and a backdrop for free.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  variant = "dialog",
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const placement =
    variant === "drawer"
      ? "m-0 ml-auto h-dvh max-h-dvh w-full max-w-md rounded-none border-l"
      : "m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog element itself (not its content) is the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
      className={`border-line bg-surface text-fg p-0 shadow-xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-[2px] ${placement}`}
    >
      <div className="flex h-full flex-col">
        <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 id={titleId} className="text-fg text-base font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-fg-muted mt-0.5 text-sm">
                {description}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-icon -mr-2">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{open && children}</div>
      </div>
    </dialog>
  );
}
