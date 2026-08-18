# Binge Eating Tracker — Program Feature Spec

A companion app for the enhanced self-help program in *Overcoming Binge Eating* (2nd ed.),
Christopher G. Fairburn. The app is a **tool for running the program**, not a replacement for
the book — the user reads the book; the app holds the records, the timing, and the review loop.

> **The app is a companion to the book, not a replacement.** It assumes the user has read the book
> and is working the program from it. The app replaces the pen and paper used for logging — it does
> not teach, explain, or walk the user through the program. Where understanding is needed, the user
> reads the chapter. See AGENTS.md §2 for the boundary test this implies.

> **Note on the book's own advice.** Fairburn explicitly recommends paper records over phones,
> because people using devices log *what* and *when* but skip the circumstances, thoughts, and
> feelings — the part that actually drives change. This app is designed against that failure mode.
> See [Design principles](#design-principles).

---

## 1. Scope & constraints

| Constraint | Decision |
|---|---|
| Platform | Local-first web app (PWA), installed to iOS home screen |
| Data location | On-device only (IndexedDB). No account, no server, no sync, no telemetry |
| Offline | Fully functional offline after install. No PC, no dev server, no network required |
| Hosting | Static build → GitHub Pages / Cloudflare Pages / Netlify free tier |
| Backup | Manual JSON export/import (browser storage *can* be evicted — this matters) |
| Calorie counting | **Deliberately absent.** The program treats calorie counting as a form of dieting to be dismantled |
| Audience | Single user (you). Multi-user/monetization is a later conversation |

### The reminder problem — read this before planning

Reminders are a must-have, and the web platform is genuinely weak here. Honest options:

| Approach | Fires with app closed? | Needs a server? | Works offline? | Verdict |
|---|---|---|---|---|
| `Notification` API from an open page | No | No | Yes | Useless for meal reminders |
| Service worker + Periodic Background Sync | No (not on iOS) | No | Yes | Chrome-only, not iOS |
| Web Push (iOS 16.4+, installed PWA only) | Yes | **Yes** — push server + cron | No (needs network) | Real solution, but breaks "no server" |
| **Generated `.ics` calendar events** | **Yes** (native iOS Calendar alerts) | **No** | **Yes** | **V1 choice** |
| iOS Shortcuts automation / Clock alarms | Yes | No | Yes | Manual setup, good fallback |

**Decision: reminders are deferred to V1.** The MVP ships without any notification mechanism —
the app tells you what's next when you open it, and nothing more. This keeps the first build purely
static and removes the largest platform risk from the critical path.

**V1 approach when we get there:** on saving a day's plan, generate `.ics` calendar events with
alerts for each planned meal/snack and for the weigh-in. iOS Calendar fires them natively, offline,
with the app closed, and needs no server. **Later:** optional Web Push via a free Cloudflare Worker
+ Cron Trigger, for a tighter in-app experience at the cost of a server dependency.

---

## 2. Design principles

1. **Real time, not recall.** Logging is timestamped at entry. The app records the gap between
   "time of eating" and "time logged" and surfaces it in reviews — accuracy is a program metric.
2. **Context is not optional.** Column 6 (circumstances, thoughts, feelings) is a first-class
   field, not a buried "notes" box — especially when an episode is marked excessive or an urge is
   logged. This is the app's answer to Fairburn's objection to phone monitoring.
3. **No numbers the program doesn't want.** No calories, no macros, no portion weights, no
   step/exercise integration, no daily weight.
3b. **Forms, not instruction.** Every screen is something the user fills in or reads back from their
   own records. The app carries no teaching content — that is the book's job.
4. **The program paces you, not the app.** Phase advancement is a decision the user makes at a
   review session, informed by change-day data. The app advises; it never auto-advances.
5. **Weight is a trend, never a reading.** Single readings are always shown on a multi-week graph,
   never as a standalone number with a delta badge.

---

## 3. Cross-cutting data model

```
Profile          phase, programStartDate, weighDay, weighTime, reviewDay, reviewTime,
                 weightUnit: kg|lb, heightUnit: cm|ftin, heightCm:int, reminderPrefs
Day              date, plan[], planCreatedAt, planMadeEveningBefore:bool, dayNotes
PlannedItem      id, kind: meal|snack, label, plannedTime, status: eaten|skipped|pending
Episode          id, datetime, loggedAt, description, place, isMeal,
                 excessive:bool, vomit:bool, laxative:bool, diuretic:bool,
                 context, linkedPlannedItemId?
Urge             id, datetime, kind: eat|vomit, intensity, contextNote,
                 activityUsed?, outcome: resisted|gave-in
Weighing         date, weightGrams:int
WeekSummary      weekNo, startDate, binges, vomits, laxatives, changeDays,
                 weightGrams, notes, phaseAtWeekEnd, reviewed:bool
ReviewSession    date, kind: checkin|weekly, step, answers{},
                 decision: stay|advance, note, completedAt?
DayReviewAnswer  reviewId, date, monitoredAccurately, bingeCount, vomits, laxatives,
                 diuretics, wasChangeDay, note, computedSnapshot{}, discrepancy?
Activity         id, text, active            (Step 3 alternative activities)
ProblemRecord    date, problem, solutions[], implications[], chosen, acted, nextDayReview
AvoidedFood      name, difficultyGroup 1-4, introducedDate?   (Dieting module)
PieChart         date, slices[{label, weight}]                (Body Image module)
CheckingLog      datetime, kind: check|compare|avoid|feel-fat, context (Body Image module)
MaintenancePlan  keepDoing[], warningSigns[], lapsePlan       (Ending Well)
```

### Units — stored canonical, displayed converted

All body measurements are stored in one canonical unit and converted only at the display edge.

| Quantity | Stored as | Displayed as |
|---|---|---|
| Weight | **Integer grams** | kg or lb per `weightUnit`, rounded to **0.1** |
| Height | **Integer centimetres** | cm, or ft + in per `heightUnit` |

The unit toggle is a display preference only — switching it never migrates, rewrites, or rounds
stored data, so flipping back and forth is lossless. Entry accepts the user's chosen unit and
converts to grams on write. Rounding happens once, at render.

### Two derived rules worth calling out

**Binge counting — the user counts, the app does not.** The book defines a binge as *a chain of
asterisks* and gives **no** rule for where one chain ends and the next begins. Any threshold the app
imposed would be invented, and presenting an invented number as authoritative would be worse than
presenting none.

So: **the binge count for a week is entered by the user during the weekly review, and is the sole
source of truth.** The app does not compute, infer, or second-guess it.

What the app does instead is make chains *easy to read*: in the day record, runs of consecutive
asterisked episodes are rendered as visually contiguous groups, exactly as a chain of asterisks
reads on paper. That is presentation of the user's own marks, not an algorithm — no count is
asserted and no grouping is claimed to be correct.

**Change days.** A change day is any day the user did their best to follow the program — and the
*definition expands with each phase*. This is the engine that drives advancement, so it must be
phase-aware:

| Phase | A change day requires |
|---|---|
| Step 1 | Monitored accurately + adhered to weekly weighing |
| Step 2 | …+ planned the day's meals/snacks, ate them, didn't eat in the gaps |
| Step 3 | …+ used alternative activities against urges |
| Step 4 | …+ practiced problem solving where relevant |
| Dieting module | …+ no strict dieting / introduced avoided foods as planned |
| Body Image module | …+ practiced the module's checking/comparison assignments |

**The user decides whether a day was a change day**, during the guided weekly review, having just
re-read that day's record — several criteria ("monitored accurately") are inherently self-assessed.
The app computes its own read and shows it only *after* the user commits theirs. See §4.4.

---

## 4. Phase-by-phase feature spec

Tags: **[MVP]** first build · **[V1]** soon after · **[LATER]** deferred

---

### Phase 0 — Getting Ready *(Ch. 9)*

The book's pre-program work: deciding to change, choosing when to start, and checking whether
self-help is appropriate.

| Feature | Tag |
|---|---|
| Pros/cons of changing — two-column editable list, kept permanently and re-surfaceable at low-motivation moments and at Step 5 | V1 |
| "When to start" checklist — is the next few months a reasonable window (no major life upheaval, no competing commitments) | V1 |
| Self-help suitability screen — flags when professional help is indicated (very low weight, pregnancy, medical complications, clinical depression, substance misuse), with a link to Appendix I guidance and a standing "get help" screen | V1 |
| Program commitment: set start date, make it a priority, decide whether a friend/relative is helping | V1 |
| Baseline BMI calculator (Appendix II) — informational only, not a target | LATER |
| Standing safety/crisis screen, always reachable from the menu — **the one place carrying explanatory text**, per AGENTS.md §2 | MVP |

---

### Step 1 — Starting Well *(Ch. 10)* · the foundation, never dropped

Two components: **self-monitoring** and **weekly weighing**.

#### 4.1 Monitoring record — the core screen **[MVP]**

A day view reproducing the six-column record:

| Col | Field | App treatment |
|---|---|---|
| 1 | Time | Defaults to now; editable. Also stores `loggedAt` to measure real-time accuracy |
| 2 | Food & drink | Free text, no calories. Meals marked (the book's brackets) with a meal/snack toggle |
| 3 | Place | Free text with recent-places quick-pick; room-level when at home |
| 4 | `*` Excessive | Toggle — "did this feel excessive *at the time*" |
| 5 | V/L | Vomit / laxative / diuretic toggles |
| 6 | Context & comments | Prominent. Prompted hard whenever col 4 or 5 is set, or an urge is logged |

Supporting features:
- Fast-entry flow: two taps to open an entry, time pre-filled **[MVP]**
- "Log now" from the home screen / lock-screen shortcut **[V1]**
- Real-time accuracy indicator — a gentle per-day stat, not a scold **[V1]**
- Day view is fully editable and back-fillable, but back-filled entries are visibly marked **[MVP]**
- Whole-day read-only "record view" that looks like the paper record, for review sessions **[V1]**

#### 4.2 Weekly weighing **[MVP]**

- **User chooses the weigh day and time** (any weekday; a weekday is recommended by the book, but
  not enforced). From V1, the reminder fires on that day only
- Single weight entry per week; the app **refuses to be a daily weight tracker** — logging off-day
  weights is possible but prompts a reflection and is excluded from the trend line
- Weight entered in the user's chosen unit, stored in grams, displayed to 0.1 (see §3)
- Weight graph over weeks, with the interpretation rule made visible: no conclusions from fewer
  than 3–4 readings; the chart shows a trend band rather than week-over-week deltas
- Optional "scale out of sight" nudge for users who weigh compulsively **[V1]**

#### 4.3 Review sessions **[MVP for Step 1, V1 for later steps]**

The book sets two cadences, and the app mirrors both:

| | Cadence | Length | Produces |
|---|---|---|---|
| **Check-in review** | Every 3–4 days | ~5–10 min | Reflection answers, stay/advance decision |
| **Weekly review** | On a **user-chosen day + time** | ~20–30 min | A summary sheet row, written by the user |

The review day is set independently of the weigh day — they may be the same day or different.
The program week runs from review day to review day.

Common to both:
- Scheduled with a reminder; the weekly one asks you to set the time aside deliberately
- Question set is **specific to the current phase** — Step 1 asks: Have I been monitoring? Can I
  improve it? Am I weighing weekly? What patterns are emerging?
- Answers saved and re-readable — a longitudinal record of the user's own reflection
- Each session ends in an explicit stay/advance decision
- Sessions are pausable and resumable; a half-finished weekly review is preserved, not discarded

#### 4.4 Weekly review — the guided walkthrough **[MVP]**

**The summary sheet is an output of the review, not an input to it.** The app has all the numbers
already, but handing them over would remove the work that makes the session useful. Fairburn has
the user obtain these figures *from their own monitoring records* — reading back the week is the
therapeutic act. So the app withholds what it knows and asks.

**Flow:**

1. **Sit down.** Framing screen: this is a session, not a form. Estimated time shown.
2. **Day-by-day walkthrough.** For each of the seven days, the day's monitoring record is shown in
   read-only paper-record layout, and the user answers for that day:
   - Did I monitor accurately today?
   - How many binges did I have? *(you count them, by reading the chains of asterisks in the
     record above — the app does not count these for you)*
   - Any vomiting / laxatives / diuretics? How many?
   - Was this a change day, by the current phase's definition?
   - Anything notable about this day
3. **Commit, then compare — for V/L only.** After the user commits a day's answers, the app reveals
   its own count of vomiting/laxative/diuretic episodes, which it can derive exactly because those
   are explicit per-episode flags. Agreement is silent; a mismatch is surfaced neutrally, with the
   option to look again and revise either the answer or the underlying record.

   **Binge counts are never compared.** There is no correct machine answer to compare against (see
   §3), so the user's count stands unchallenged.
4. **Pattern questions** (the book's fourth Step 1 question, asked once across the whole week):
   Have my binges had anything in common? Same time of day? What were the triggers? What did I eat
   in them — foods I avoid at other times? What am I eating *outside* binges — am I restricting,
   delaying, avoiding? Are all my days the same, or do diet days and binge days alternate?
5. **Phase-specific questions** for the current step or module.
6. **Weight** for the week, and any events that shaped it (illness, travel, disruption).
7. **The summary row is generated** from the user's answers — not from the raw data.
8. **Advancement decision**, informed by the change-day count the user just arrived at themselves.

**Why commit-then-compare matters.** Committing before seeing the app's V/L count keeps the reading
of the record honest — you can't drift into rubber-stamping if you don't yet know the answer. The
gaps are recorded over time as material for reflection, never as a score.

**Design guards:**
- No "skip all" / "accept all" button. Days are stepped through one at a time
- But never punitive, and never a wall — the session can be paused, and a day can be marked
  "can't recall / didn't monitor" honestly, which is itself an answer
- If a weekly review is skipped entirely, the app writes a provisional row from computed data,
  clearly marked **unreviewed**, so the trend graph has no holes. It can be reviewed retroactively

#### 4.5 Summary sheet **[MVP]**

One row per program week: week no. · binges · V/L counts · change days · weight · notes — written
by the weekly review above, editable afterwards, with phase transitions and disruptive life events
marked on the row. Rows are flagged **reviewed** or **unreviewed**. This is the single artefact the
user reads at every check-in and at Step 5.

**Advancement guidance:** 6–7 change days in the week → ready for Step 2.

---

### Step 2 — Regular Eating *(Ch. 11)* · the highest-impact intervention

Three planned meals + two or three planned snacks; nothing in the gaps.

| Feature | Tag |
|---|---|
| **Daily plan builder** — set the day's meal/snack times, the evening before or that morning. Records which, since the book asks for advance planning | MVP |
| Plan templates — weekday / weekend / shift patterns, reusable | MVP |
| **4-hour gap rule** — the planner warns on any gap over 4 hours (morning gap exempted, per the book's exception) | MVP |
| **"Next up" home screen** — at any moment, what's next and when. This is the book's "stepping-stones through the day" made literal | MVP |
| Meal reminders at each planned time (see §1 reminder strategy) | V1 |
| Mark each planned item eaten / skipped; links to the monitoring entry | MVP |
| Gap-eating indicator — episodes logged outside planned items are visible as such (informational, never punitive) | MVP |
| Chapter pointer — the phase screen names its chapter ("Step 2 · Ch. 11") and nothing more. No guidance text | MVP |
| Vomiting / laxative / diuretic tracking (per-episode flags, weekly counts). Tracking only — no guidance content | V1 |
| ~~Eating out, shopping & cooking tips~~ — **cut**: teaching content, belongs to the book | — |
| Step 2 review questions + updated change-day definition | V1 |

---

### Step 3 — Alternatives to Binge Eating *(Ch. 12)*

Filling the gaps, and urge surfing.

| Feature | Tag |
|---|---|
| **Alternative activities list** — user's own, each with three self-check toggles: active · enjoyable · realistic | V1 |
| One-tap access to the list from anywhere — this is the whole point; it must be reachable mid-urge | V1 |
| **Urge log** — kind (eat/vomit), intensity, what was happening, which activity was used, outcome | V1 |
| Urge timer — a plain countdown the user starts when an urge hits, with the elapsed time logged against the urge | V1 |
| Mood-enhancing playlist slot (link/reference only; no audio integration) | LATER |
| Urge pattern insights — time of day, day of week, preceding context | V1 |
| Step 3 review questions + change-day definition update | V1 |
| "What's happening to my weight?" — the multi-week trend reading taught in this chapter | V1 |

---

### Step 4 — Problem Solving *(Ch. 13)*

| Feature | Tag |
|---|---|
| **Problem-solving form** — six sections as field labels only (problem · specified · solutions · implications · chosen · acted). A worksheet to fill in, not a tutorial to follow | V1 |
| **The seventh step**: next-day review of *how well you problem-solved* — auto-scheduled the following day. The book is emphatic that this is where the skill is built | V1 |
| Solutions brainstorm with no-censoring UI (add freely, evaluate only afterwards) | V1 |
| Prompt to problem-solve whenever an urge is logged — urges signal a problem behind them | V1 |
| Library of past problem records, searchable — recurring problems become visible | V1 |
| Step 4 review questions + change-day definition update | V1 |

---

### Step 5 — Taking Stock *(Ch. 14)* · the branch point

Held after 6–8 weeks at Steps 2–4. Not a new practice — a structured decision.

| Feature | Tag |
|---|---|
| **Progress report** built from the summary sheet: binge frequency trend, V/L trend, change days, weight trend | V1 |
| Outcome triage against the book's three cases: (1) going well → continue; (2) little change but not following the program well → revisit commitment; (3) little change despite best efforts → seek outside help, with Appendix I guidance | V1 |
| "Other problems" flag (depression, self-esteem, perfectionism, relationships) with Appendix IV pointers and the option to pause the program | V1 |
| **Two branching questions** that select the remaining modules: <br>· Does dieting contribute? → Dieting Module <br>· Do shape/weight concerns contribute? → Body Image Module | V1 |
| Module sequencing rule enforced: if both apply, start with the more important one and add the second after 3–4 weeks — **never both at once** | V1 |

---

### Dieting Module *(Ch. 15)*

Addresses the three forms of dieting.

| Feature | Tag |
|---|---|
| Strict-dieting self-assessment questionnaire (what I eat between binges; what triggers my binges) | V1 |
| **Form 1 — delaying eating**: already handled by Step 2; module reinforces regular eating | V1 |
| **Form 2 — restricting amount**: calorie-limit / dietary-rule inventory the user writes, plus a stop-counting commitment they record | V1 |
| **Form 3 — food avoidance**: the supermarket-walk exercise → **avoided-foods list**, grouped into 3–4 difficulty tiers | V1 |
| **Food reintroduction planner** — schedule avoided foods into planned meals/snacks, easiest tier first, ~2 weeks per tier, only on days the user feels in control. Tracks which foods have been reintroduced and how it went | V1 |
| Dietary-rule tracker — name each rule, mark when broken and what followed (tests the all-or-nothing pattern directly) | V1 |
| Module review sessions + "when to move on" guidance | V1 |

---

### Body Image Module *(Ch. 16)*

The longest module; addresses overconcern about shape and weight.

| Feature | Tag |
|---|---|
| **Self-evaluation pie chart** builder — list what you judge yourself on, rank, allocate slices. Flags the ≥⅓ shape/weight threshold for overconcern | V1 |
| Pie chart re-review over the following week, and **re-drawn periodically** to visualise change over months | V1 |
| **Increasing other life areas**: new-activity picker (things you used to enjoy / meant to try), scheduling, and follow-through tracking | V1 |
| **Shape checking log** — frequency, form (mirror, pinching, measuring, clothes), context; then targeted reduction of each form | V1 |
| **Comparison making** — log comparisons: who, when, context, and what the user concluded | V1 |
| **Shape avoidance** — graded exposure plan for avoided clothing, mirrors, situations | V1 |
| **"Feeling fat"** — log episodes, identify what the feeling is masking (the book's core insight: it's usually a displaced emotion or sensation) | V1 |
| Body Image review sessions + "when to move on" | V1 |
| Mindset / marginalising-the-eating-problem work | LATER |

---

### Ending Well *(Ch. 17)* · maintenance & relapse prevention

| Feature | Tag |
|---|---|
| Final taking-stock: continue, or seek further help | V1 |
| **Maintenance plan** — which program elements to keep (regular eating indefinitely; problem solving; periodic reviews), which to retire (monitoring, weekly weighing) and the conditions for retiring them | V1 |
| Tapering support: reduce monitoring/weighing while continuing reviews for ~3 months | V1 |
| **Lapse vs relapse framing** — the app never uses the word "relapse" for a bad day, by design | V1 |
| **Personal warning-signs list** and a written **lapse action plan**: spot it early → restart monitoring, weighing and regular eating → identify and address the trigger | V1 |
| **Setback detector** — if binge frequency rises against the user's own baseline, offer the lapse plan and a one-tap "restart the program" that reopens Step 1 without wiping history | V1 |
| Trigger checklist for setbacks (adverse events, depression, shape/weight events, eating events — above all, restarting dieting) | V1 |
| Long-term light mode: occasional check-ins after the program ends | LATER |

---

## 5. Global features (not phase-specific)

| Feature | Tag |
|---|---|
| **Phase selector** — user sets/changes their current phase at any time; the app adapts screens, review questions, change-day definition and reminders. Phase history is kept | MVP |
| Home screen: today's plan, next item, quick-log button, review-due badge | MVP |
| PWA install, offline-first service worker, home-screen icon | MVP |
| JSON export / import (backup + device migration) | MVP |
| Print/PDF export of a day's record and the summary sheet | V1 |
| App lock (PIN / biometric) — this is sensitive data on a phone | V1 |
| Light/dark theme; deliberately calm, non-gamified visual design | MVP |
| **No streaks, badges, or scores.** Change days are counted, not celebrated — all-or-nothing thinking is the pathology being treated | MVP |
| Data reset / delete-everything | MVP |

---

## 6. Explicit non-goals

- Calorie, macro, or portion tracking
- Daily weight tracking or weight-loss targets
- Food database / barcode scanning
- Exercise or step tracking
- Social features, sharing, leaderboards
- Any diagnosis, or advice that substitutes for clinical care
- Cloud sync or accounts (for now)

---

## 7. MVP scope — Steps 1 and 2

**Decided:** the first build implements **Step 1 (Starting Well)** and **Step 2 (Regular Eating)**
only, with **no reminders**. Starting phase is **Step 2**.

1. **Phase selector** — Steps 1 and 2 selectable; later phases visible but marked not yet built,
   so the program's shape is legible from day one. Phase history kept
2. **Monitoring record** — full six-column, real-time, back-fill visibly marked
3. **Daily plan builder** — evening before or morning of, 4-hour gap warnings, reusable templates
4. **Next-up screen** — what's next and when, shown on open. No notifications in MVP
5. **Weekly weighing** — user-chosen weigh day, single reading per week, multi-week trend graph
6. **Guided weekly review** — user-chosen review day, day-by-day walkthrough, user-counted binges,
   commit-then-compare on V/L, writes the summary row
7. **Summary sheet** — weekly rows, change-day counting, reviewed/unreviewed state
8. **Step 1 check-in reviews** every 3–4 days
9. **Settings** — units (kg/lb, cm/ft-in), weigh day, review day, phase
10. PWA install, offline service worker, JSON export/import, safety screen

**Deferred to V1:** all reminders (`.ics` calendar generation for meals and weigh-ins), Steps 3–5,
both modules, Ending Well, print/PDF export, app lock.

**Why this cut holds together:** Steps 1 and 2 are the foundation that never gets dropped — the
monitoring record and weekly weighing run underneath every later phase, and regular eating is the
single highest-impact intervention in the program. Steps 3–5 and the modules add screens on top
without changing the data model.

---

## 8. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Reminder strategy | **Deferred to V1.** MVP has no notifications; `.ics` calendar generation when we build it |
| 2 | Binge grouping rule | **No algorithm.** The 2-hour rule was my invention, not Fairburn's — he gives no threshold. The user counts binges at the weekly review; the app only renders asterisk chains legibly |
| 3 | Units | **User-selectable.** Weight stored as integer grams, displayed kg/lb to 0.1. Height stored as whole cm, displayed cm or ft/in |
| 4 | Weigh day & review day | **Both user-chosen**, independently. Program week runs review day to review day |
| 5 | Scope & starting phase | **Steps 1 and 2** this build. Starting phase: **Step 2** |

---

## 9. Open questions

None blocking. Worth deciding during the build:

- Default meal/snack times to pre-fill a new plan with (the book's example runs 8:00 / 10:30 /
  12:30 / 15:30 / 19:00 / 21:00 — usable as a starting template you then edit)
- Whether the midmorning snack is on by default, given the book's morning exception to the 4-hour
  rule
