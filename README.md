# resume-tailor

**Paste your resume and a job description; get specific, honest suggestions for tailoring the resume to that job, powered by Claude.**

**Live demo:** _coming soon (deploying to Vercel)_

![Resume Tailor showing a 78/100 match score, missing keywords, and side-by-side bullet rewrites](docs/screenshot.png)

<sub>Screenshot shows sample output.</sub>

## Features

- **Match score** (0–100) with a one-paragraph summary of fit and the biggest opportunity.
- **Missing keywords** from the job description, ranked by importance, with advice on where to include them honestly.
- **Bullet rewrites** shown side by side with the original, each with a reason and a copy button.
- **Section advice**, **gaps** (requirements your resume doesn't show), and **cover letter points**.
- **Streaming**: progress appears as soon as the model starts writing, and you can cancel at any time.
- **Actual cost per run**, calculated from the token counts Anthropic returns, not just an estimate.
- **Bring your own key.** Three models: Sonnet 5.5 (default), Haiku 4.5 (quick check), Opus 5.5 (deepest).
- Clear, human-readable errors for bad keys, rate limits, outages, network drops, refusals and truncated output, with retry where it makes sense.

## Tech stack

| Concern    | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Language   | TypeScript (`strict`, `noUncheckedIndexedAccess`)         |
| UI         | React 19 + Vite                                           |
| Styling    | Tailwind CSS v4                                           |
| AI         | `@anthropic-ai/sdk` (browser mode), structured outputs    |
| Validation | Zod                                                       |
| Tests      | Vitest + React Testing Library (jsdom)                    |
| Lint       | ESLint (typescript-eslint `strictTypeChecked`) + Prettier |
| Hosting    | Vercel (static), with a Content-Security-Policy           |

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run check      # typecheck + lint + format check + tests
npm run build && npm run preview   # production build, served with the production security headers
```

You'll need an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/settings/keys). Tests never call the real API.

## How it works

```
components ──▶ useAnalysis (state machine) ──▶ AnalysisProvider ──▶ Anthropic Messages API
                     │                                                (streamed, from the browser)
                     └──▶ parseJson + Zod ──▶ ResultView
```

- `src/schemas/analysis.ts`: the Zod schema. The TypeScript type is inferred from it, **and** it generates the JSON Schema sent to the API, so it's the single source of truth.
- `src/prompts/analyze.ts`: system prompt and message builder (pure functions, unit tested).
- `src/services/provider.ts`: the `AnalysisProvider` interface; `anthropic.ts` implements it.
- `src/hooks/useAnalysis.ts`: request lifecycle as a discriminated union: `idle | loading | streaming | success | error`.
- `src/config/models.ts`: model IDs, prices, token caps and effort in one typed list.

Components never call the API directly.

## Design decisions

**Why bring your own key?** The app has no backend, so there's nothing to pay for per user and nothing to secure on a server. Each user's usage is billed to their own Anthropic account.

**Why do keys stay in the browser?** The key goes straight from your browser to `api.anthropic.com` and nowhere else. It's kept in memory by default; "Remember my key on this device" is opt-in, uses `localStorage`, and "Clear key" removes it. The Content-Security-Policy only allows network requests to this site and to `api.anthropic.com`, so even injected code couldn't send the key elsewhere. The SDK requires `dangerouslyAllowBrowser: true` for this; the flag exists to stop developers shipping _their own_ key to users, which is not what's happening here.

**Why validate AI output with Zod?** Model output is untrusted input. The request uses Anthropic's structured outputs to constrain the response to the schema, but constrained decoding supports only part of JSON Schema. Numeric bounds, for example, are dropped, so the 0–100 score range is only enforced by Zod. Validation also catches truncated or malformed responses. If validation fails, the app retries once automatically, then shows a friendly error with the raw text available.

**Why stream?** A careful analysis takes a while. Streaming shows progress as soon as the model starts writing, lets you cancel, and means an interrupted response isn't lost: whatever arrived is kept and shown.

**Why the "no fabrication" rule?** A tailored resume is only useful if every line is true. The system prompt forbids inventing skills, employers, titles, dates or metrics. Requirements the resume doesn't show go under **Gaps** instead of being written in. Pasted text is treated as data, not instructions, so a job posting can't tell the model to inflate the score.

**Why show actual cost?** Sonnet and Opus think before answering, and thinking tokens are billed as output, so any upfront estimate is a range. After each run the app shows the real cost from the token counts the API reports. Each model also has a `max_tokens` cap so a runaway response can't cost much.

**Why no automatic model fallback?** If the model declines a request, the app says so plainly instead of quietly re-running it on a different model you didn't choose and paying for that.

## Privacy

- No backend, no analytics, no tracking, no cookies.
- Your resume, the job description and your API key are sent **only** to Anthropic's API, directly from your browser.
- Nothing is stored unless you tick "Remember my key on this device", which saves only the key, only in your browser.
- Anthropic's handling of API data is covered by [their privacy policy](https://www.anthropic.com/legal/privacy). Don't paste anything you wouldn't want sent to an AI provider.

## Roadmap

**Phase 2**

- PDF resume upload (sent to Claude as a document block; no client-side PDF parsing)
- Opt-in local saving of resume text
- History of past analyses with match scores
- Dark mode
- Cover letter draft generation
- Export results as Markdown

**Phase 3**

- More providers (OpenAI, Gemini) via the `AnalysisProvider` interface
- Multiple resume versions
- Browser extension or bookmarklet to grab the job description from the current tab
