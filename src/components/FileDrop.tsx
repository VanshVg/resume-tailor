import { useId, useState, type DragEvent } from "react";
import { ACCEPTED_FILE_TYPES, MAX_PDF_BYTES } from "../utils/readResumeFile";
import { UploadIcon } from "./ui/icons";

interface FileDropProps {
  readonly onFile: (file: File) => void;
  readonly describedBy?: string;
}

/** A keyboard-accessible file picker that also accepts drag and drop. */
export function FileDrop({ onFile, describedBy }: FileDropProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={onDrop}
      className={`has-focus-visible:outline-focus group flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors has-focus-visible:outline-2 ${
        dragging
          ? "border-accent bg-info-bg"
          : "border-line-strong hover:border-accent hover:bg-sunken"
      }`}
    >
      <input
        id={id}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        aria-describedby={describedBy}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          // Allow choosing the same file again after removing it.
          e.target.value = "";
        }}
      />
      <span className="bg-info-bg text-accent-fg grid size-11 place-items-center rounded-full">
        <UploadIcon className="size-5" />
      </span>
      <span className="text-fg text-sm font-medium">
        <span className="text-accent-fg">Choose a file</span> or drag it here
      </span>
      <span className="text-fg-subtle text-xs">
        PDF (best) up to {MAX_PDF_BYTES / 1024 / 1024} MB, or .txt / .md
      </span>
    </label>
  );
}
