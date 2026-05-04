# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server with HMR
npm run build      # tsc -b, then Vite production build
npm run lint       # ESLint flat config
npm run preview    # preview production build
```

No test runner configured yet. Add Vitest before writing tests.

## Stack

React 19 + TypeScript 6 + Tailwind CSS v4 + Vite 8. Frontend-only (no backend in this repo).

- **React Compiler** enabled via `babel-plugin-react-compiler` — avoid manual `useMemo`/`useCallback` unless profiling shows the compiler missed an optimization
- **Tailwind v4** uses `@tailwindcss/vite` plugin, no `tailwind.config.js` — config is in CSS
- **Strict TypeScript**: `noUnusedLocals`, `noUnusedParameters` enforced. No `any`, no `!` assertions, no `as` casts except DOM narrowing
- Package manager: `npm`. Do not mix with `bun`/`yarn`/`pnpm`

## Coding rules

Full rules in `.claude/rules/coding-rules.md`. Key constraints:

- File > 300 lines → split. Function > 50 lines → extract. Nesting > 2 levels → early return
- No `any` → use `unknown` + type guards or define an interface
- Booleans: `is`/`has`/`should`/`can` prefix. Event handlers: `handle` prefix
- Files: `kebab-case.ts`. Types/interfaces: `PascalCase` (no `I` prefix)
- Imports: grouped (stdlib → third-party → local), alphabetical within groups
- No abstractions until 2+ usages. No defensive code for impossible scenarios
- `useEffect` with async → always `AbortController` cleanup
- Multiple loading booleans → use discriminated union state machine

**AI anti-patterns to avoid** (documented in coding-rules.md §5):
- Don't implement unrequested features
- When a test fails, fix the code — never weaken the assertion
- When lint fails, fix the code — never loosen the config
- Don't bypass blocked tools via alternative commands (sed, python -c, etc.)
- Ask before refactoring >1 file on a vague instruction

## Dev pipeline (skills)

Workflow is orchestrated via `/dev-*` skills. Full docs: `.claude/docs/dev-pipeline.md`.

| Phase | Skills |
|-------|--------|
| Discovery | `/dev-ideate` → `/dev-brainstorm` |
| Planning | `/dev-plan` → `/dev-docs` |
| Implementation | `/dev-docs-execute` ↔ `/dev-docs-review` |
| Full autopilot | `/dev-autopilot docs/active/[name]` |
| Closure | `/dev-docs-complete` → `/dev-compound` |

Working docs live in `docs/active/[name]/` (3 files: plan, kontekst, zadania). Completed tasks move to `docs/completed/`. Solved problems/bugs → `docs/solutions/[category]/`.

**Typical new feature flow:**
```
/dev-brainstorm [idea]
/dev-plan
/dev-docs
/dev-autopilot docs/active/[name]
```

## Quality gate (pre-commit)

Run in order: typecheck → lint → tests (when configured). Block on any failure.
No `console.log`, no `TODO/FIXME`, no new `any`, no hardcoded secrets in committed code.
