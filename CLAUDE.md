# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173/basil-cooking-planner/
npm test -- --run    # Vitest unit tests (single run)
npm run test:watch   # Vitest in watch mode
npm run build        # tsc -b (strict type check) + Vite production build
npm run lint         # ESLint
npm run test:e2e     # Playwright e2e (requires dev server running separately)
```

**Run a single test file:**
```bash
npm test -- --run tests/plan/regen.test.ts
```

### Before every commit and push

Run **both** of the following and fix all errors before committing:

```bash
npm test -- --run
npm run build
```

Vitest transpiles with esbuild and does not enforce TypeScript errors (unused imports, type mismatches). `tsc -b` inside the build is the only gate for those. Tests can be green while the build is broken.

## Architecture

### State

All app state lives in a single **Zustand store** (`src/store/useAppStore.ts`) with `persist` middleware writing to `localStorage` under key `family-cooking-planner`. The store holds dishes, plans, day modifiers, tag definitions, cumulative limits, and settings (locale, theme, weekStartDay, familyName).

Side effects with DOM or i18n (`setTheme`, `setLocale`) live in the store actions. Pure data mutations (`cascadeDeleteTag`, `duplicatePlanData`) are extracted to `src/lib/` so they are unit-testable.

FOUC prevention: `src/main.tsx` reads the persisted theme from localStorage and sets `document.documentElement.dataset.theme` synchronously before `createRoot()`.

### Routing

Hash-based routing (`react-router-dom` with `HashRouter`). Routes: `/` (calendar), `/dishes`, `/new-plan`, `/plans`, `/extend-plan/:id`, `/import`, `/settings`.

### Genetic Algorithm

The GA runs in a **Web Worker** (`src/lib/ga/worker.ts`) via Comlink so it never blocks the UI. Entry point from React is `src/lib/ga/runner.ts` (`runGAInWorker`), which returns `{ promise, abort }`.

GA pipeline per generation:
1. `buildSlots` (`chromosome.ts`) — one slot per day; locked/skipped days are `fixed`, others get a filtered candidate list based on `difficultyCap` and `requiresTags`
2. `randomChromosome` — picks one candidate dish ID per slot using a seeded PRNG (`mulberry32` in `rng.ts`)
3. `decode` (`decoder.ts`) — chromosome → `PlannedMeal[]`, inserting leftover rows for `servesDays > 1` dishes; locked meals are restored verbatim
4. `evaluate` (`fitness.ts`) — scores the plan and generates `Violation[]`; hard violations (same meat, difficulty overrun, tag requirements) carry large penalties; soft violations carry small ones
5. Tournament selection + uniform crossover + mutation (`operators.ts`) → next generation

### Day capacity

`src/lib/days/capacity.ts` computes a `DayContext` for each date: base difficulty cap is 3 on weekdays and 5 on weekends; an explicit `difficultyCap` modifier overrides the base; cap is clamped to a minimum of 1.

### Themes

Two visual themes: **Trattoria della Famiglia** (default, Italian restaurant) and **PRL** (Polish People's Republic canteen). The active theme is stored as `'trattoria' | 'prl'` in the Zustand store and applied by setting `document.documentElement.dataset.theme = 'prl'` (or removing the attribute for Trattoria). All PRL overrides are scoped to `html[data-theme="prl"]` in `src/styles/theme.css` using hardcoded hex values (not `var()` references) to avoid CSS cascade issues.

### i18n

`react-i18next` with two locales: `pl` (default) and `en`. Translation files are `src/i18n/pl.ts` and `src/i18n/en.ts`. Always add new keys to **both** files. Violation messages produced inside the GA Web Worker are Polish-only (i18n is not available in the worker context).

### Data persistence and import/export

- **JSON backup**: `src/lib/storage/exportImport.ts` — `buildAppData` / `parseJson` / `exportJson`; imports are validated through Zod schemas in `src/lib/storage/schema.ts` (current `SCHEMA_VERSION = 1`)
- **Compressed share link**: `encodeLink` / `decodeLink` use pako deflate + base64url; the URL fragment is `#/import?d=<payload>`
- **CSV**: dishes import/export in `src/lib/csv/dishImport.ts`; plan export in `src/lib/csv/exporter.ts`

### Testing layout

Unit tests mirror the `src/lib/` structure under `tests/`. Vitest is configured with jsdom. E2e tests (Playwright) live in `tests/e2e/` and are excluded from `npm test`.

New pure functions should go in `src/lib/` so they can be tested without React or Zustand. Do not add testable logic directly to components or the store.

## Git

- Push with `git push origin main`
- CI runs on every push and PR via `.github/workflows/ci.yml` (unit tests only)
- Pushes to `main` also trigger `.github/workflows/deploy.yml` (tests + build + GitHub Pages deploy)
