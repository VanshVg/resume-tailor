import { useCallback, useRef, useState } from "react";
import { ActionBar } from "./components/ActionBar";
import { CoverLetterPanel } from "./components/CoverLetterPanel";
import { EmptyState } from "./components/EmptyState";
import { ErrorBanner } from "./components/ErrorBanner";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { JobCard } from "./components/JobCard";
import { KeySetup } from "./components/KeySetup";
import { ProgressPanel, ResultsSkeleton } from "./components/ProgressPanel";
import { ResumeCard } from "./components/ResumeCard";
import { ResultView } from "./components/ResultView";
import { SettingsDialog } from "./components/SettingsDialog";
import { TopBar } from "./components/TopBar";
import { DEFAULT_MODEL_ID, getModel, isModelId, type ModelId } from "./config/models";
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

const dateTime = (date: Date) =>
  date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function App({ provider = anthropicProvider }: AppProps) {
  const [theme, setTheme] = useTheme();
  const key = useApiKey();
  const [modelId, setModelId] = useState<ModelId>(DEFAULT_MODEL_ID);
  const resume = useResume();
  const [jobDescription, setJobDescription] = useState("");
  const history = useHistory();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { add: addToHistory } = history;
  const saveToHistory = useCallback(
    ({ analysis, modelId: usedModel, spend, params, completedAt }: AnalysisSuccess) => {
      addToHistory({
        id: newEntryId(),
        createdAt: completedAt.toISOString(),
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
  const resultsRef = useRef<HTMLHeadingElement>(null);

  const currentResume = toResumeInput(resume.draft);
  const check = checkInputs({ apiKey: key.apiKey, resume: resume.draft, jobDescription });
  const busy = state.status === "loading" || state.status === "streaming";
  const hasKey = key.apiKey.trim() !== "";

  function focusResults() {
    // Move focus (and the viewport) to the results so the change is noticed.
    requestAnimationFrame(() => {
      resultsRef.current?.focus();
    });
  }

  function analyze() {
    if (check.blockers.length > 0 || busy || !currentResume) return;
    setViewing(null);
    run({ apiKey: key.apiKey.trim(), modelId, input: { resume: currentResume, jobDescription } });
    focusResults();
  }

  function viewSaved(entry: HistoryEntry) {
    setViewing(entry);
    setHistoryOpen(false);
    focusResults();
  }

  function deleteSaved(id: string) {
    if (viewing?.id === id) setViewing(null);
    history.remove(id);
  }

  const showResultsHeading = viewing !== null || state.status !== "idle";

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        theme={theme}
        onThemeChange={setTheme}
        keyConnected={hasKey}
        onOpenSettings={() => {
          setSettingsOpen(true);
        }}
        savedCount={history.enabled ? history.entries.length : null}
        onOpenHistory={() => {
          setHistoryOpen(true);
        }}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8">
        <div className="max-w-2xl">
          <h1 className="text-fg text-2xl font-semibold tracking-[-0.025em] sm:text-[2rem] sm:leading-10">
            Tailor your resume to the job
          </h1>
          <p className="text-fg-muted mt-2">
            Get an honest match score, missing keywords and rewritten bullets for a specific job.
            Nothing is invented: only rewording and reframing of what&apos;s already on your resume.
          </p>
        </div>

        {!hasKey && <KeySetup onSave={key.connect} />}

        <form
          aria-label="Analysis inputs"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            analyze();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ResumeCard resume={resume} textStatus={check.resume} />
            <JobCard
              value={jobDescription}
              onChange={setJobDescription}
              status={check.jobDescription}
            />
          </div>
          <ActionBar
            modelId={modelId}
            onModelChange={setModelId}
            blocker={check.blockers[0] ?? null}
            busy={busy}
            sizeWarning={check.size}
            hasPdf={resume.draft.mode === "file" && resume.draft.pdf !== null}
          />
        </form>

        <section aria-labelledby="results-heading" className="space-y-4">
          <h2
            id="results-heading"
            ref={resultsRef}
            tabIndex={-1}
            className={
              showResultsHeading ? "text-fg text-lg font-semibold focus:outline-none" : "sr-only"
            }
          >
            {viewing ? "Saved analysis" : "Results"}
          </h2>

          {viewing ? (
            <>
              <div className="border-info-line bg-info-bg text-info-fg flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
                <p>Viewing a saved analysis from {dateTime(new Date(viewing.createdAt))}.</p>
                <button
                  type="button"
                  onClick={() => {
                    setViewing(null);
                  }}
                  className="btn-secondary px-2.5 py-1 text-xs"
                >
                  Back to current analysis
                </button>
              </div>
              <ResultView
                analysis={viewing.analysis}
                modelId={viewing.modelId}
                spend={viewing.spend}
                createdAt={new Date(viewing.createdAt)}
                coverLetter={
                  <CoverLetterPanel
                    key={`saved-${viewing.id}`}
                    provider={provider}
                    apiKey={key.apiKey}
                    modelId={isModelId(viewing.modelId) ? viewing.modelId : modelId}
                    input={
                      currentResume
                        ? {
                            resume: currentResume,
                            jobDescription: viewing.jobDescription,
                            analysis: viewing.analysis,
                          }
                        : null
                    }
                    unavailableReason="Saved analyses don't store your resume. Add it above (or turn on “Remember on this device”) to draft a cover letter."
                    note="Uses the resume currently in the resume card."
                  />
                }
              />
            </>
          ) : (
            <>
              <div aria-live="polite">
                {busy && (
                  <ProgressPanel
                    message={
                      state.status === "streaming"
                        ? `Writing suggestions… ${state.partialText.length.toLocaleString("en-US")} characters received`
                        : `${getModel(modelId).label} is reading your resume and thinking…`
                    }
                    detail={
                      state.attempt > 1
                        ? "The first response wasn't in the expected format, so this is an automatic retry."
                        : "This usually takes 20–60 seconds."
                    }
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

              {busy && <ResultsSkeleton />}
              {state.status === "idle" && <EmptyState />}
              {state.status === "success" && (
                <ResultView
                  analysis={state.analysis}
                  modelId={state.modelId}
                  spend={state.spend}
                  createdAt={state.completedAt}
                  coverLetter={
                    <CoverLetterPanel
                      key={`run-${state.runId}`}
                      provider={provider}
                      apiKey={key.apiKey}
                      modelId={state.modelId}
                      input={{
                        resume: state.input.resume,
                        jobDescription: state.input.jobDescription,
                        analysis: state.analysis,
                      }}
                      unavailableReason=""
                    />
                  }
                />
              )}
            </>
          )}
        </section>
      </main>

      <footer className="border-line border-t">
        <div className="text-fg-subtle mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs">
          <p>No server, no analytics, no tracking. Runs entirely in your browser.</p>
          <a
            href="https://github.com/VanshVg/resume-tailor"
            target="_blank"
            rel="noreferrer"
            className="hover:text-fg underline-offset-2 hover:underline"
          >
            Source on GitHub
          </a>
        </div>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
        apiKey={key}
        keyStatus={check.apiKey}
      />
      <HistoryDrawer
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
        }}
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
    </div>
  );
}
