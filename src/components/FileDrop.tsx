import { useId, useState, type DragEvent } from "react";
import { ACCEPTED_FILE_TYPES, MAX_PDF_BYTES } from "../utils/readResumeFile";

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
      className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center text-sm has-focus-visible:outline-2 has-focus-visible:outline-indigo-600 ${
        dragging ? "border-indigo-600 bg-indigo-50" : "border-slate-300 bg-slate-50"
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
      <span className="font-medium text-indigo-700">Choose a file</span>
      <span className="text-slate-600">or drag it here</span>
      <span className="text-xs text-slate-500">
        PDF up to {MAX_PDF_BYTES / 1024 / 1024} MB, or .txt / .md
      </span>
    </label>
  );
}
