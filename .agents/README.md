# Agent assets

This repository is agent-agnostic. The rules live in one canonical file and are
mirrored out to whatever each tool expects.

## Canonical

**[../AGENTS.md](../AGENTS.md)** — the single source of truth. Project rules,
hard constraints, architecture, and git workflow.

## Tools that need no configuration

These read `AGENTS.md` natively — clone the repo and they work:

- OpenAI Codex
- Cursor (also gets a rules file below, for `alwaysApply`)
- Zed
- Aider
- Google Jules

## Generated adapters

Thin pointers back to `AGENTS.md`, produced by `scripts/sync-agents.sh`.
**Do not edit them** — edit `AGENTS.md` and re-run the script.

| File | Tool | Tracked |
|---|---|---|
| `../CLAUDE.md` | Claude Code | yes |
| `../.cursor/rules/project.mdc` | Cursor | yes |
| `../.github/copilot-instructions.md` | GitHub Copilot | yes |
| `../.claude/launch.json` | Claude Code preview pane | no — gitignored |

The three tracked pointers are a few lines each and carry no instructions of
their own, so any tool finds the rules with no setup. `.claude/launch.json` is
genuinely tool-specific runtime config and stays out of git; the portable
equivalents are `npm run dev` in `package.json` and `server.port` in
`vite.config.ts`.

## Regenerating

```sh
sh .agents/scripts/sync-agents.sh
```

## Adding another tool

Add a stanza to `scripts/sync-agents.sh` that writes a pointer to `AGENTS.md`.
Keep it thin: duplicated rules drift.
