import type { ResumeDraft, ResumeMode } from "../hooks/useResume";
import type { PdfResume } from "../types/resume";
import type { FieldStatus } from "../utils/validateInputs";
import { FieldMessage } from "./FieldMessage";
import { ResumeField } from "./ResumeField";
import { TextField } from "./TextField";

interface InputPanelProps {
  readonly resume: ResumeDraft;
  readonly onResumeModeChange: (mode: ResumeMode) => void;
  readonly onResumeTextChange: (text: string) => void;
  readonly onResumePdfChange: (pdf: PdfResume | null) => void;
  readonly resumeStatus: FieldStatus;
  readonly rememberResume: boolean;
  readonly onRememberResumeChange: (value: boolean) => void;
  readonly resumeSaveWarning: string | null;
  readonly onClearResume: () => void;
  readonly jobDescription: string;
  readonly onJobDescriptionChange: (value: string) => void;
  readonly jobDescriptionStatus: FieldStatus;
  readonly sizeStatus: FieldStatus;
}

export function InputPanel(props: InputPanelProps) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <ResumeField
          draft={props.resume}
          onModeChange={props.onResumeModeChange}
          onTextChange={props.onResumeTextChange}
          onPdfChange={props.onResumePdfChange}
          textStatus={props.resumeStatus}
          remember={props.rememberResume}
          onRememberChange={props.onRememberResumeChange}
          saveWarning={props.resumeSaveWarning}
          onClear={props.onClearResume}
        />
        <div className="md:pt-9">
          <TextField
            label="Job description"
            hint="Paste the full posting, including requirements."
            value={props.jobDescription}
            onChange={props.onJobDescriptionChange}
            status={props.jobDescriptionStatus}
            placeholder="We're hiring a Senior TypeScript Engineer…"
          />
        </div>
      </div>
      <FieldMessage id="input-size-status" status={props.sizeStatus} />
      <p className="mt-2 text-xs text-slate-600">
        Your resume and the job description are sent to Anthropic for analysis. Don&apos;t include
        anything you wouldn&apos;t want sent to an AI provider (you may want to remove your phone
        number and address).
      </p>
    </div>
  );
}
