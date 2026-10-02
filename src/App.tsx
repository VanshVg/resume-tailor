import { useId, useState } from "react";
import { InputPanel } from "./components/InputPanel";
import { ErrorBanner } from "./components/ErrorBanner";
import { KeyInput } from "./components/KeyInput";
import { ModelSelect } from "./components/ModelSelect";
import { ProgressPanel } from "./components/ProgressPanel";
import { ResultView } from "./components/ResultView";
import { DEFAULT_MODEL_ID, getModel, type ModelId } from "./config/models";
import { useAnalysis } from "./hooks/useAnalysis";
import { useApiKey } from "./hooks/useApiKey";
import { anthropicProvider } from "./services/anthropic";
import type { AnalysisProvider } from "./services/provider";
import { checkInputs } from "./utils/validateInputs";

interface AppProps {
  /** Injectable for tests; the real app talks to Anthropic. */
  readonly provider?: AnalysisProvider;
}

export function App({ provider = anthropicProvider }: AppProps) {
  const key = useApiKey();
  const [modelId, setModelId] = useState<ModelId>(DEFAULT_MODEL_ID);
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const { state, run, retry, cancel, reset } = useAnalysis(provider);
  const blockersId = useId();

  const check = checkInputs({ apiKey: key.apiKey, resume, jobDescription });
  const busy = state.status === "loading" || state.status === "streaming";
  const canAnalyze = check.blockers.length === 0 && !busy;

  function analyze() {
    if (!canAnalyze) return;
    run({ apiKey: key.apiKey.trim(), modelId, input: { resume, jobDescription } });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <h1 className="text-2xl font-bold text-slate-900">Resume Tailor</h1>
          <p className="mt-1 text-slate-600">
            Paste your resume and a job description to get specific, honest suggestions for
            tailoring your resume to the role. Nothing is invented: only rewording, reordering and
            reframing of what&apos;s already there.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <form
          className="space-y-6"
          aria-label="Analysis inputs"
          onSubmit={(e) => {
            e.preventDefault();
            analyze();
          }}
        >
          <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
            <KeyInput
              apiKey={key.apiKey}
              onApiKeyChange={key.setApiKey}
              remember={key.remember}
              onRememberChange={key.setRemember}
              onClear={key.clear}
              storageFailed={key.storageFailed}
              status={check.apiKey}
            />
            <ModelSelect value={modelId} onChange={setModelId} />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <InputPanel
              resume={resume}
              onResumeChange={setResume}
              resumeStatus={check.resume}
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              jobDescriptionStatus={check.jobDescription}
              sizeStatus={check.size}
            />
          </section>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={!canAnalyze}
              aria-describedby={check.blockers.length > 0 ? blockersId : undefined}
              className="btn-primary px-6 py-3 text-base"
            >
              Analyze
            </button>
            {check.blockers.length > 0 && !busy && (
              <ul id={blockersId} className="text-sm text-slate-600">
                {check.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </form>

        <div aria-live="polite">
          {(state.status === "loading" || state.status === "streaming") && (
            <ProgressPanel
              phase={state.status}
              attempt={state.attempt}
              receivedChars={state.status === "streaming" ? state.partialText.length : 0}
              modelLabel={getModel(modelId).label}
              onCancel={cancel}
            />
          )}
          {state.status === "error" && (
            <ErrorBanner
              kind={state.kind}
              partialText={state.partialText}
              spend={state.spend}
              onRetry={retry}
              onDismiss={reset}
            />
          )}
        </div>

        {state.status === "idle" && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Your match score, keyword gaps and suggested bullet rewrites will appear here.
          </p>
        )}
        {state.status === "success" && (
          <ResultView analysis={state.analysis} modelId={state.modelId} spend={state.spend} />
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-500">
        No analytics, no tracking, no server. Your resume and key go only to Anthropic&apos;s API,
        directly from your browser.
      </footer>
    </div>
  );
}
