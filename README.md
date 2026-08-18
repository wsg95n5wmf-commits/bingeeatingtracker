# Binge Eating Tracker

A companion app for the self-help program in *Overcoming Binge Eating* (2nd ed.),
Christopher G. Fairburn.

**It replaces the pen and paper, not the book.** It assumes you have read the book and are
working the program from it. It holds your records; it does not teach, explain, or walk you
through the program. See [SPEC.md](SPEC.md) for the full feature spec and [AGENTS.md](AGENTS.md)
for the rules this codebase is built to.

Currently implements **Step 1 (Starting Well)** and **Step 2 (Regular Eating)**.

## Your data

Everything is stored in your browser on your device — IndexedDB, no account, no server, no sync,
no analytics, and the app makes no network requests of any kind. Nobody else can see it, including
whoever hosts the files.

The flip side: browsers can clear their own storage, and clearing site data deletes everything.
**Export a backup from Settings periodically** and keep it somewhere you trust.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Other commands:

```bash
npm test
```

```bash
npm run build
```

## Putting it on your phone

The app is a PWA: once installed to the home screen it runs fully offline, with no computer
involved.

1. Deploy the contents of `dist/` to any static host (see below).
2. Open the URL in Safari on your iPhone.
3. Share → **Add to Home Screen**.
4. Open it once while online so the service worker caches everything. After that it works offline.

Data lives per-origin, so keep the same URL — moving hosts starts you with an empty database.
Use export/import to carry records across.

### Free hosting

The build is static files with no backend, so any of these work on their free tier:

- **Cloudflare Pages** — connect the repo, build `npm run build`, output `dist`
- **Netlify** — same settings
- **GitHub Pages** — push `dist/` to a `gh-pages` branch

`vite.config.ts` sets `base: './'` and the app uses hash routing, so it works from a subdirectory
without extra configuration.

## Not included, deliberately

No calorie or macro tracking, no daily weighing, no streaks or badges, no food database, no social
features. Each of these works against something the program is trying to undo — the reasons are in
[AGENTS.md](AGENTS.md) §2.

Reminders are not in this build. See [SPEC.md](SPEC.md) §1 for the plan.

## Working on this with an AI agent

The rules live in [AGENTS.md](AGENTS.md) and nowhere else. Codex, Cursor, Zed, Aider and Jules
read it natively; other tools get a thin generated pointer. Regenerate the pointers with:

```bash
sh .agents/scripts/sync-agents.sh
```

See [.agents/README.md](.agents/README.md) for the layout.

## Architecture

Clean architecture with unidirectional data flow — `domain/` (pure, no React or Dexie) ←
`data/` (Dexie) and `ui/` (screens + view-model hooks). IndexedDB is the single source of truth;
Dexie's `useLiveQuery` pushes changes to every screen observing them. Details in
[AGENTS.md](AGENTS.md) §3.
