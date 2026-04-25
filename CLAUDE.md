# Basil Cooking Planner — Claude Guidelines

## Before every commit and push

Always run both of the following and fix any errors before committing:

```bash
npm test -- --run   # unit tests (Vitest)
npm run build       # tsc -b strict type check + Vite production build
```

**Why both?** Vitest transpiles with esbuild and does not enforce TypeScript errors (unused imports, type mismatches, etc.). `tsc -b` inside the build step is the only thing that catches those. Tests can be green while the build is broken.

## Project structure

- `src/lib/` — pure domain logic, no React, fully unit-testable
- `src/store/useAppStore.ts` — Zustand store; side effects (DOM, i18n) live here
- `src/pages/`, `src/components/` — React UI
- `tests/` — Vitest unit tests mirroring `src/lib/` structure
- `tests/e2e/` — Playwright end-to-end tests (excluded from `npm test`)

## Testing rules

- All logic extracted to `src/lib/` must have a corresponding test file in `tests/`
- Do not add logic directly to components or the store if it can be a pure function
- New pure functions go in `src/lib/` so they are testable without React or Zustand

## i18n

- All user-visible strings must use `t('key')` — no hardcoded Polish or English text in components
- Translation keys live in `src/i18n/pl.ts` and `src/i18n/en.ts` — add to both files together

## Git

- Push with `git push origin main` (remote is `origin`, branch is `main`)
- Never force-push `main`
