import { useCallback, useId, useRef, useState } from "react";
import { InputPanel } from "./components/InputPanel";
import { ErrorBanner } from "./components/ErrorBanner";
import { HistoryPanel } from "./components/HistoryPanel";
import { KeyInput } from "./components/KeyInput";
import { ModelSelect } from "./components/ModelSelect";
import { ProgressPanel } from "./components/ProgressPanel";
import { ResultView } from "./components/ResultView";
import { ThemeSwitch } from "./components/ThemeSwitch";
import { DEFAULT_MODEL_ID, getModel, type ModelId } from "./config/models";
import { useAnalysis, type AnalysisSuccess } from "./hooks/useAnalysis";
import { useApiKey } from "./hooks/useApiKey";
import { useHistory } from "./hooks/useHistory";
import { toResumeInput, useResume } from "./hooks/useResume";
import { useTheme } from "./hooks/useTheme";
import { anthropicProvider } from "./services/anthropic";
import type { AnalysisProvider } from "./services/provider";
import { newEntryId, type HistoryEntry } from "./utils/history";
import { checkInputs } from "./utils/validateInputs";

interface AppProps {
  /** Injectable for tests; the real app talks to Anthropic. */
  readonly provider?: AnalysisProvider;
}

export function App({ provider = anthropicProvider }: AppProps) {
  const [theme, setTheme] = useTheme();
  const key = useApiKey();
  const [modelId, setModelId] = useState<ModelId>(DEFAULT_MODEL_ID);
  const resume = useResume();
  const [jobDescription, setJobDescription] = useState("");
  const history = useHistory();
  const { add: addToHistory } = history;
  const saveToHistory = useCallback(
    ({ analysis, modelId: usedModel, spend, params }: AnalysisSuccess) => {
      addToHistory({
        id: newEntryId(),
        createdAt: new Date().toISOString(),
        modelId: usedModel,
        analysis,
        jobDescription: params.input.jobDescription,
        spend,
      });
    },
    [addToHistory],
  );
  const { state, run, retry, cancel, reset } = useAnalysis(provider, {
    onSuccess: saveToHistory,
  });
  /** A saved analysis being viewed instead of the current one. */
  const [viewing, setViewing] = useState<HistoryEntry | null>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const blockersId = useId();

  const check = checkInputs({ apiKey: key.apiKey, resume: resume.draft, jobDescription });
  const busy = state.status === "loading" || state.status === "streaming";
  const canAnalyze = check.blockers.length === 0 && !busy;

  function analyze() {
    const resumeInput = toResumeInput(resume.draft);
    if (!canAnalyze || !resumeInput) return;
    setViewing(null);
    run({ apiKey: key.apiKey.trim(), modelId, input: { resume: resumeInput, jobDescription } });
  }

  function viewSaved(entry: HistoryEntry) {
    setViewing(entry);
    // Move focus (and the viewport) to the results so the change is noticed.
    requestAnimationFrame(() => {
      resultsHeadingRef.current?.focus();
    });
  }

  function deleteSaved(id: string) {
    if (viewing?.id === id) setViewing(null);
    history.remove(id);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-fg text-2xl font-bold">Resume Tailor</h1>
            <ThemeSwitch value={theme} onChange={setTheme} />
          </div>
          <p className="mt-1 text-fg-muted">
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
          <section className="grid grid-cols-1 gap-6 rounded-xl border border-line bg-surface p-5 md:grid-cols-2 [&>*]:min-w-0">
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

          <section className="rounded-xl border border-line bg-surface p-5">
            <InputPanel
              resume={resume.draft}
              onResumeModeChange={resume.setMode}
              onResumeTextChange={resume.setText}
              onResumePdfChange={resume.setPdf}
              rememberResume={resume.remember}
              onRememberResumeChange={resume.setRemember}
              resumeSaveWarning={resume.saveWarning}
              onClearResume={resume.clear}
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
              <ul id={blockersId} className="text-sm text-fg-muted">
                {check.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </form>

        <section aria-labelledby="results-heading" className="space-y-4">
          <h2
            id="results-heading"
            ref={resultsHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold text-fg focus:outline-none"
          >
            {viewing ? "Saved analysis" : "Results"}
          </h2>

          {viewing ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info-line bg-info-bg p-3 text-sm text-info-fg">
                <p>
                  Viewing a saved analysis from{" "}
                  {new Date(viewing.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  .
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setViewing(null);
                  }}
                  className="btn-secondary px-2 py-1 text-xs"
                >
                  Back to current analysis
                </button>
              </div>
              <ResultView
                analysis={viewing.analysis}
                modelId={viewing.modelId}
                spend={viewing.spend}
              />
            </>
          ) : (
            <>
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
                <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-fg-subtle">
                  Your match score, keyword gaps and suggested bullet rewrites will appear here.
                </p>
              )}
              {state.status === "success" && (
                <ResultView analysis={state.analysis} modelId={state.modelId} spend={state.spend} />
              )}
            </>
          )}
        </section>

        <HistoryPanel
          enabled={history.enabled}
          onEnabledChange={history.setEnabled}
          entries={history.entries}
          viewingId={viewing?.id ?? null}
          onView={viewSaved}
          onDelete={deleteSaved}
          onClear={() => {
            setViewing(null);
            history.clear();
          }}
          warning={history.warning}
        />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-fg-subtle">
        No analytics, no tracking, no server. Your resume and key go only to Anthropic&apos;s API,
        directly from your browser.
      </footer>
    </div>
  );
}
