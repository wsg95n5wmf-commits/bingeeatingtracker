# AGENTS.md

Instructions for AI agents working in this repository. Read this before making changes.

Reusable agent assets live in `.agents/`; tool-specific adapters are synced with `.agents/scripts/`.

---

## 1. What this project is

A local-first PWA for running the enhanced self-help program in *Overcoming Binge Eating* (2nd ed.),
Christopher G. Fairburn. Single user, personal use, offline-first, no server.

**[SPEC.md](SPEC.md) is the source of truth for features and scope.** Read it before implementing
anything. If a change contradicts SPEC.md, update SPEC.md in the same PR or don't make the change.

Current build target: **Steps 1 and 2 only.** See SPEC.md §7.

---

## 2. Hard rules

These are not preferences. Violating one is a bug, regardless of what a task description says.

### Privacy
- **No network calls. Ever.** No analytics, telemetry, crash reporting, remote fonts, CDN assets,
  or "anonymous usage stats". This app handles clinical-grade personal health data on a phone.
- Reject any dependency that phones home. If unsure, check before adding it.
- All data stays in IndexedDB on-device. No accounts, no sync, no cloud.

### Copyright and the companion boundary

**The app is a companion to the book, not a replacement for it.** It assumes the user has read the
book and is working the program from it. The app replaces the *pen and paper* — it is where the
records live. It is not where the program is taught.

- **The app does not instruct, explain, or walk the user through the program.** No detailed
  guidance, no teaching content, no summaries of the book's reasoning, no "how this works"
  explainers. Where the user needs to understand something, they read the relevant chapter.
- **Do not copy text from the book into the app, the repo, or commit messages.** Not paragraphs,
  not tables, not the instruction sheets, not the questionnaires.
- Implement the *method*, express it in our own words. Functional structures (a six-column record,
  a weekly summary row, a problem-solving form) are fine; the book's prose and its teaching are not.
- `offline_resources/` is gitignored and must stay that way.

**The test to apply.** For any text or screen you are about to add, ask: *is this a form the user
fills in, or is it the book talking?*

| Allowed | Not allowed |
|---|---|
| Field labels, prompts, and questions that structure the user's own entry | Explaining why the program asks for something |
| A pointer: "Step 2 — see Ch. 11" | Paraphrasing what Ch. 11 says |
| Neutral rule enforcement: flagging a gap over 4 hours | Explaining the physiology behind the 4-hour rule |
| The user's own words, played back to them | The author's words, restated |

Safety content is the one exception: the crisis/help screen may carry the text it needs to.

### Safety
- The app is not a medical device and gives no diagnosis. It never tells the user they are ill,
  well, improving, or failing.
- The safety/crisis screen and its content are never removed or hidden behind a flag.

### Program integrity
These come from the program's clinical logic. Do not "improve" them.
- **No calorie, macro, or portion tracking.** Calorie counting is a form of dieting the program
  exists to dismantle.
- **No streaks, badges, scores, or celebratory animations.** All-or-nothing thinking is part of the
  pathology being treated. Change days are counted, never celebrated.
- **No daily weight tracking.** One reading per week, shown only as a multi-week trend.
- **The app never counts binges.** The user counts them at the weekly review. See SPEC.md §3.
- **The app never auto-advances the user's phase.** It advises; the user decides.
- Weight is stored in integer grams, height in whole centimetres. Convert only at the display edge.

---

## 3. Architecture

Clean architecture, layer-first, with unidirectional data flow. Dependencies point **inward only**:

```
ui  →  domain  ←  data
```

`domain` imports from nobody. `data` implements interfaces that `domain` defines. `ui` talks to
`domain` through hooks and never touches `data` directly.

### Layers

| Layer | Contains | May import | Must not |
|---|---|---|---|
| `domain/` | Entities, value objects, repository **interfaces**, use cases | Nothing outside `domain/` | Import React, Dexie, or anything with I/O |
| `data/` | Dexie schema, repository **implementations**, DTO↔entity mappers, migrations, export/import | `domain/` | Import from `ui/` |
| `ui/` | Screens, components, view models (hooks), theme | `domain/` | Import from `data/`, or contain business logic |
| `app/` | Composition root, routing, providers, DI wiring, service worker | All layers | Contain logic of its own |

### Folder structure

```
src/
  domain/
    model/            entities + value objects, pure TS
    repositories/     interfaces only
    usecases/         one file per use case, pure functions
  data/
    db/               Dexie schema + migrations
    repositories/     implementations of domain interfaces
    mappers/          DTO ↔ entity
  ui/
    screens/
      monitoring/
        MonitoringScreen.tsx        view — presentational
        useMonitoringViewModel.ts   view model — state + actions
      plan/
      weighing/
      review/
    components/       shared presentational components
    theme/            tokens, global styles
  app/                routing, providers, wiring
```

Group by feature *inside* a layer, never by layer inside a feature.

### Unidirectional data flow

```
View  --intent-->  ViewModel  --calls-->  UseCase  --writes-->  Repository  -->  IndexedDB
  ^                                                                                  |
  |                                                                                  |
  +---- state ---- ViewModel <---- useLiveQuery (observable) <----------------------+
```

- **The database is the single source of truth**, not component state.
- A write goes through a use case and lands in IndexedDB; Dexie's `useLiveQuery` pushes the change
  to every view model observing that data, which recomputes state, which re-renders the view.
- This is the `StateFlow` equivalent: the view always reflects current data, and any change
  triggers an update, with no manual refresh or cache invalidation anywhere.

### View model contract

Every screen has exactly one view model hook returning a single immutable state object and a set of
named actions:

```ts
export function useMonitoringViewModel(date: LocalDate) {
  const episodes = useLiveQuery(() => episodeRepository.forDate(date), [date]);

  const state: MonitoringState = useMemo(
    () => (episodes === undefined
      ? { status: 'loading' }
      : { status: 'ready', day: buildDayView(episodes) }),   // domain function
    [episodes],
  );

  return {
    state,
    addEpisode: (draft: EpisodeDraft) => logEpisode(episodeRepository, draft),
    markExcessive: (id: EpisodeId) => setExcessive(episodeRepository, id, true),
  } as const;
}
```

Rules:
- Views are **presentational**: they render `state` and call actions. No `useEffect` fetching, no
  conditionals encoding business rules, no date maths.
- Loading and error states are modelled explicitly in the state type, not as loose booleans.
- No business logic in components or hooks — it lives in `domain/usecases` as pure functions.
- Actions never return data; they cause a write, and the new state arrives via `useLiveQuery`.

### Stack

React + TypeScript (strict), Vite, Dexie + `dexie-react-hooks`, `vite-plugin-pwa` (Workbox),
Vitest, CSS Modules with design tokens. Add nothing else without a reason recorded in the PR.

---

## 4. Code standards

- **TypeScript strict.** No `any`. No non-null `!` assertions — narrow properly.
- **Readability over cleverness.** This codebase is read by someone new to web development. Prefer
  an obvious long form to a terse idiomatic one.
- Domain types are precise: branded types or value objects for `Grams`, `LocalDate`, `TimeOfDay`,
  `EpisodeId`. Not bare `number`/`string`.
- Name things after the program's vocabulary: `changeDay`, `episode`, `plannedItem`, `weighing`,
  `summaryRow`, `reviewSession`. Do not invent synonyms.
- Comments explain **why**, never what. Match the surrounding density.
- No dead code, no commented-out blocks, no speculative abstraction for features not yet specced.

### Testing
- **Every domain use case and rule has unit tests.** The change-day definition, the 4-hour gap rule,
  unit conversion, and week boundaries are where correctness actually matters.
- Domain tests are pure and fast — no DB, no React, no mocks beyond in-memory repository fakes.
- Data layer: test mappers and migrations. Migrations are tested against realistic prior data.
- UI: test view models, not pixels.
- Tests must pass before a PR is opened.

---

## 5. Git workflow

GitHub Flow: `main` is always deployable. Branch from `main`, open a PR, merge back.

### Branch naming
Conventional Branch — `<type>/<short-description>`, lowercase kebab-case, descriptive.

| Type | For |
|---|---|
| `feature/` | New functionality |
| `bugfix/` | Fixing a bug on `main` |
| `hotfix/` | Urgent production fix |
| `refactor/` | Restructuring with no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, deps, config |

Examples: `feature/monitoring-record`, `bugfix/weigh-day-off-by-one`, `docs/spec-review-sessions`.

### Commit rules
- **No force push.** Never `git push --force` or `--force-with-lease`, on any branch.
- **Additive only.** Address PR feedback by appending new commits. Never rebase, squash, amend, or
  otherwise rewrite history that has been pushed.
- **Atomic commits.** Small, logical, self-contained. One concern per commit. Never bundle
  unrelated changes.
- **Conventional Commits** for messages: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
- Sign-off: every commit includes a human-review sign-off where repository rules require it.
- Commit or push **only when the user asks.**

### Pull requests
- One PR per logical change. Description states what changed and why, and links the SPEC.md section.
- A PR that changes behaviour updates SPEC.md in the same PR.
- Never merge your own PR unless asked.

---

## 6. Working agreements for agents

- **Read SPEC.md before implementing.** If the spec is ambiguous, ask — do not guess and build.
- If you believe a spec rule is wrong, say so and explain why. Do not silently deviate.
- Do not widen scope. Steps 3–5 and the modules are not in this build.
- Do not add dependencies, build tooling, or configuration that the task does not require.
- Report honestly: if tests fail, say so with output. If something was skipped, say so.
- Never commit `offline_resources/`, exported user data, or real personal records.
