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

## Development requirements

- **Unit tests**: Every new pure function added to `src/lib/` must have a corresponding unit test in `tests/` mirroring the same directory structure.
- **Docs**: When modifying the GA algorithm, data model, or adding significant features, update `CLAUDE.md`, `README.md`, and `docs/algorithm.md` to reflect the change.

## Architecture

### State

All app state lives in a single **Zustand store** (`src/store/useAppStore.ts`) with `persist` middleware writing to `localStorage` under key `family-cooking-planner`. The store holds dishes, plans, day modifiers, tag definitions, cumulative limits, and settings (locale, theme, weekStartDay, familyName).

Side effects with DOM or i18n (`setTheme`, `setLocale`) live in the store actions. Pure data mutations (`cascadeDeleteTag`, `duplicatePlanData`) are extracted to `src/lib/` so they are unit-testable.

FOUC prevention: `src/main.tsx` reads the persisted theme from localStorage and sets `document.documentElement.dataset.theme` synchronously before `createRoot()`.

### Routing

Hash-based routing (`react-router-dom` with `HashRouter`). Routes: `/welcome` (landing), `/dishes`, `/new-plan`, `/plans`, `/plans/:id`, `/extend-plan/:id`, `/import`, `/settings`, `/style-guide` (dev-only, unlinked). `/` redirects to `/welcome` for first-run users (`familyName === null`) and to `/plans` otherwise. `<NavBar>` is hidden on `/welcome` so the hero can be full-bleed.

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

Two visual themes: **Trattoria della Famiglia** (default) and **PRL** (Polish People's Republic canteen). The active theme is stored as `'trattoria' | 'prl'` in the Zustand store and applied by setting `document.documentElement.dataset.theme = 'prl'` (or removing the attribute for Trattoria). PRL is now a **~20-line token override** at the bottom of `src/styles/theme.css` — it re-points the same semantic tokens the base rules consume, rather than repeating every rule with hardcoded hex.

#### The two-zone token model — read before touching a selector

**The app is a dark table with paper content laid on it.** The page ground, nav, hero and page headers are the TABLE (dark). Cards, day cards, modals, tables and panels are PAPER (light ivory). Both themes share this structure; only the palette differs.

`--ink` / `--ink-soft` / `--hairline` / `--wine-text` / `--basil-text` / `--wine-tint` / `--basil-tint` / `--surface` / `--bg` are **contextual**. They hold the table's dark values at `:root`, and are redefined to paper values on the paper-scope selector group (`.card, .menu-card, .modal, .day-card, table.menu-table, .violations-panel, .menu-dropdown-panel, .dish-row, .sg-zone-paper`). Custom properties inherit, so every descendant self-corrects. `--bg` is the current zone's own ground (opaque sticky headers, knockout rings); `--surface` is the sunken fill *within* a zone.

There is exactly **one** paper-zone selector list. PRL deliberately has no copy of it — every declaration inside resolves a `--paper-*` token, and PRL re-points those at its own `:root`. Keeping a second, PRL-prefixed copy is what previously let `.sg-zone-paper` drift out of sync.

- **New components consume the contextual tokens** — never reach for `--paper-ink` directly. A component then lands correctly in whichever zone contains it, automatically.
- **A new container that should read as paper** must be added to that selector group.
- `--wine` / `--basil` / `--on-fill` are **fills** (solid buttons, status). They carry their own contrast, so they don't flip.
- `@media print` re-points every contextual token to a plain light document — the dark table must never reach paper.

**Fonts.** Three CSS variables: `--font-display` (Cormorant Garamond — h1/h2, hero, step titles), `--font-ui` (Inter — the ambient default on `html, body` and virtually every concrete UI element), and `--font-accent`, a third voice used only by `.day-dish`. Trattoria resolves `--font-accent` to `--font-ui` (it has no separate accent face); PRL overrides the three to Oswald / Roboto / Roboto Condensed. Set the family on the token, never per-component — the tracked-caps treatment (`--font-ui` 600 uppercase, `letter-spacing: 0.12em`) on eyebrows, labels, buttons and badges is a *treatment*, not a fourth font. Fonts load via deferred `<link>`s in `index.html` (with `preconnect`), not a CSS `@import`. All families ship `latin-ext`, required for Polish diacritics.

**Theme photography.** Two tokens, both re-pointed in PRL's `:root` so no surface needs its own `html[data-theme="prl"]` override. `--hero-image` is the tall landing/nav photo (`.home-hero`, PRL's `.nav`); Trattoria uses `kitchen-hero.webp`, PRL uses `prl-hero.webp`. `--page-hero-image` is the short wide band (`.page-hero`) — a separate shot because that band is ~7:1 at 1440px and a slice of the landing photo read badly at that ratio; Trattoria's `page-hero.webp` is cropped to just the ingredients, PRL's `prl-page-hero.webp` to a flat-lay of period pantry staples. Both anchor `center top` because the `::after` gradient fades its own bottom out. The three landing-page step images (`step-cookbook`/`step-prep`/`step-cooking.webp`) have PRL counterparts (`prl-` prefixed) selected in `HomePage.tsx` by reading `theme` from the store — unlike the two tokens above, this swap is done in JS rather than CSS, since the images are inline `<img>` elements, not backgrounds.

**Contrast.** `src/lib/utils/contrast.ts` (`contrastRatio`, `meetsAA`) powers a live audit table on `/style-guide`. Re-check it after changing any palette value.

**Icons.** `lucide-react`, not emoji — the UI previously used raw emoji characters baked into i18n strings and JSX, which is why some `home.*`/nav/button copy looks terse without a leading glyph now; the icon is a sibling element in the JSX instead (`<Icon size={..} /> {t('key')}`), never embedded in translated text. `MeatIcon.tsx` wraps the meat-type mapping. The one exception is `MEAT_EMOJI` in `lib/utils/meat.ts`, kept solely for the ICS exporter's plain-text SUMMARY line.

### i18n

`react-i18next` with two locales: `pl` (default) and `en`. Translation files are `src/i18n/pl.ts` and `src/i18n/en.ts`. Always add new keys to **both** files. Violation messages produced inside the GA Web Worker are Polish-only (i18n is not available in the worker context).

### Data persistence and import/export

- **JSON backup**: `src/lib/storage/exportImport.ts` — `buildAppData` / `parseJson` / `exportJson`; imports are validated through Zod schemas in `src/lib/storage/schema.ts` (current `SCHEMA_VERSION = 1`)
- **Compressed share link**: `encodeLink` / `decodeLink` use pako deflate + base64url; the URL fragment is `#/import?d=<payload>`
- **CSV**: dishes import/export in `src/lib/csv/dishImport.ts`; plan export in `src/lib/csv/exporter.ts`
- **ICS calendar**: `src/lib/ics/exporter.ts` — `planToIcs` / `icsFileName`; one all-day `VEVENT` per cooking day (leftover and skipped days are omitted), RFC 5545 text escaping and 75-octet line folding

### Testing layout

Unit tests mirror the `src/lib/` structure under `tests/`. Vitest is configured with jsdom. E2e tests (Playwright) live in `tests/e2e/` and are excluded from `npm test`.

New pure functions should go in `src/lib/` so they can be tested without React or Zustand. Do not add testable logic directly to components or the store.

### File map

#### Types (`src/types/`)
- `dish.ts` — `Dish` interface, `MeatType` union, `MEAT_LABELS` lookup
- `plan.ts` — `Plan`, `PlannedMeal`, `Violation`, `ViolationSeverity`
- `day.ts` — `DayModifier` (per-day overrides: difficultyCap, skip, requiresTags), `CumulativeLimit`
- `tag.ts` — `TagDefinition` (name, optional maxPerWeek, minGapDays)

#### Genetic algorithm (`src/lib/ga/`)
- `types.ts` — `Chromosome`, `GAConfig`, `DEFAULT_GA_CONFIG`, `GAInput`, `DecodedPlan`, `GAProgress`
- `rng.ts` — `mulberry32` seeded PRNG
- `chromosome.ts` — `buildSlots` (day → slot with filtered candidates), `randomChromosome`
- `decoder.ts` — `decode` chromosome → `PlannedMeal[]` with leftover insertion
- `fitness.ts` — `evaluate` plan → score + violations; `DEFAULT_WEIGHTS`; all penalty/reward logic
- `operators.ts` — `tournamentSelect`, `uniformCrossover`, `mutate`
- `algorithm.ts` — `runGA` main evolution loop
- `runner.ts` — `runGAInWorker` spawns Web Worker, returns `{ promise, abort }`

#### Worker (`src/workers/`)
- `ga.worker.ts` — Comlink-exposed `run`/`abort` API bridging to `runGA`

#### Day capacity (`src/lib/days/`)
- `capacity.ts` — `computeDayContext`, `buildDayContexts` (weekday/weekend base caps, modifier overrides)

#### Plan logic (`src/lib/plan/`)
- `regen.ts` — `getLockedMealsForRegen` (past + pinned meals), `isPlanFullyInPast`
- `extend.ts` — `buildLockedMealsForExtend` (date range → locked meals), `validateExtendRange`
- `duplicate.ts` — `duplicatePlanData` (deep-copy a plan with new ID)
- `evaluate.ts` — `reevaluatePlan` (re-score after manual pin/swap)
- `pastDays.ts` — `isPastDate`, `splitByPast` (splits date-bearing items into past/upcoming for the calendar's collapsed history view)
- `quality.ts` — `computePlanQuality` (buckets a plan into a human-readable quality tier from average dish preference; `null` while hard violations remain)
- `dayCard.ts` — `isPinDisabled`, `cookedDifficulty` (rules behind `DayCard`'s pin button and difficulty bar)

#### Storage (`src/lib/storage/`)
- `schema.ts` — Zod schemas for JSON import validation (`SCHEMA_VERSION = 1`)
- `exportImport.ts` — `buildAppData`, `parseJson`, `exportJson`
- `normalize.ts` — migration/normalization of imported data
- `tagCascade.ts` — `cascadeDeleteTag` removes tag from all dishes

#### CSV (`src/lib/csv/`)
- `dishImport.ts` — CSV → `Dish[]` parser with auto-detected separator, Polish/English column names
- `exporter.ts` — plan → CSV export (semicolon, UTF-8 BOM)

#### Share (`src/lib/share/`)
- `webShare.ts` — Web Share API wrapper for mobile sharing

#### PDF (`src/lib/pdf/`)
- PDF generation using jsPDF + jspdf-autotable

#### ICS (`src/lib/ics/`)
- `exporter.ts` — `planToIcs` (plan + dish map + i18n labels → `.ics` text), `icsFileName`

#### Utils (`src/lib/utils/`)
- `date.ts` — ISO date helpers (`toISODate`, `fromISODate`, `addDays`, `daysBetween`, `listDates`), locale formatting (`formatDateLocale`, `formatMonthLocale`, `weekdayShortLocale`, `calendarDayLabels`), Polish-only legacy functions for GA worker context
- `id.ts` — `uid()` UUID generator
- `meat.ts` — `MEAT_EMOJI` lookup. On-screen UI uses `MeatIcon` (Lucide) instead; this is kept only for the ICS exporter, where the event SUMMARY is plain text and can't carry a rendered icon
- `difficultyBar.ts` — `computeDifficultySegments` (segment/overflow/divider layout for `DifficultyBar`)
- `contrast.ts` — `contrastRatio` / `meetsAA` (WCAG contrast maths behind the `/style-guide` audit table)
- `locale.ts` — `resolveInitialLocale` (maps a detected browser language tag to `'pl' | 'en'`, defaulting to Polish)

#### i18n (`src/i18n/`)
- `index.ts` — react-i18next config
- `pl.ts` — Polish translations (default locale)
- `en.ts` — English translations

#### Store (`src/store/`)
- `useAppStore.ts` — single Zustand store with persist middleware; holds all app state; side-effect actions for theme/locale; `locale` defaults from the browser-detected language (`resolveInitialLocale(i18n.resolvedLanguage)` in `src/lib/utils/locale.ts`) until the user picks one explicitly, at which point the persisted choice always wins on rehydrate

#### Hooks (`src/hooks/`)
- `useDismiss.ts` — shared Escape-key (and optional outside-click) dismiss behavior for menus/modals; used by `PlanDetailPage`'s overflow menu and `DayEditor`

#### Pages (`src/pages/`)
- `HomePage.tsx` — full-bleed landing page at `/welcome`, rendered **outside** `<NavBar>`. Hero photo with logo + lead overlaid, a three-step "how it works" flow (`I → II → III`, mirroring `/dishes` → `/new-plan` → `/plans/:id`), plain-language feature badges, and the family-name signup. `/` redirects here when `familyName === null`, else to `/plans`. Replaced the old `WelcomeModal`.
- `StyleGuidePage.tsx` — dev-only route at `/style-guide` (not linked from nav). Palette, type specimen with Polish diacritics, every button/form/badge/card state, both theme and zone toggles, and the live contrast audit. Rendered against the real `theme.css` so the review is truthful.
- `PlansListPage.tsx` — list of all plans with delete/duplicate/extend links
- `PlanDetailPage.tsx` — plan view with calendar, rename, regenerate; secondary actions (ICS calendar export, extend, duplicate, delete) live behind an overflow menu. The calendar renders inside `.calendar-surface` (a `--ground-alt` panel) so the day cards read as resting on a surface rather than floating; stripped to nothing in `@media print`
- `GeneratorPage.tsx` — new plan form (date range, day modifiers, cumulative limits)
- `ExtendPlanPage.tsx` — continue plan form (source range picker, end date)
- `DishesPage.tsx` — dish library with add/edit/delete
- `SettingsPage.tsx` — family name, theme, locale, tags, JSON export/import, reset
- `ImportPage.tsx` — import from compressed share link

#### Components (`src/components/`)
- `NavBar.tsx` — top navigation with greeting
- `Calendar.tsx` — 7-column grid with month banners, padding, day labels; splits meals into a collapsed past-days grid (hidden by default, excluded from print) and an always-visible upcoming grid via `splitByPast`
- `DayCard.tsx` — single day in the calendar (dish, `MeatIcon`, locked/leftover badges); the whole card is a `role="button"` div (`onClick` + Enter/Space) so it opens the day editor from anywhere, except the nested pin button, which calls `stopPropagation()` to act independently; a dedicated pin button toggles `meal.locked` directly with no re-evaluation; `DifficultyBar` segment count is the day's cap, red-filled count is the dish's difficulty (0 for leftovers, which the GA never checks against the cap) — a dish over budget renders as distinct overflow segments past a divider, no separate badge needed
- `DayEditor.tsx` — modal for pinning a dish to a day or marking as skip; dish search/filters are sticky at the top of the picker so they stay reachable above an on-screen keyboard, day settings (skip, required tags) are collapsed in a `<details>`
- `DifficultyBar.tsx` — renders a 1..5 value as filled/unfilled horizontal segments (dish difficulty, day difficulty cap)
- `MeatIcon.tsx` — `MeatType` → Lucide icon (`Beef`/`Ham`/`Drumstick`/`Fish`/`Leaf`), `aria-hidden`, sized via prop; renders in `currentColor` so it inherits from its container rather than taking an explicit color prop
- `NavTools.tsx` — the nav's language and theme switchers. Flags are inline SVG, not 🇵🇱/🇬🇧 emoji: regional-indicator sequences don't render on most Windows builds, and the redesign moved off emoji as an icon system. Language names (`Polski`, `English`) stay in their own language and are deliberately not translated. `setLocale` also writes `document.documentElement.lang`, which `index.html` hardcodes to `pl`
- `PageHero.tsx` — the `.page-hero` photo band (themed via `--page-hero-image`, `.no-print`) that opens `/plans`, `/plans/:id`, `/dishes` and `/settings`. Rendered as a sibling *before* each page's `.page` wrapper, since it's full-bleed. Deliberately not on `/new-plan`, `/extend-plan/:id` or `/import` — those are task flows where the band would just push the form down
- `Footer.tsx` — site-wide footer (logo, tagline, copyright); rendered once in `App.tsx` below `<Routes>`, `.no-print`
- `PlanSummary.tsx` — unique dishes count, meat types count, and a `computePlanQuality` tier badge (raw fitness score shown as a tooltip) as bare badges (no wrapper), meant to sit inline in the plan header next to the date range
- `ViolationsPanel.tsx` — grouped display of hard/soft/info violations
- `GenerateDialog.tsx` — progress modal during GA run
- `ExportDialog.tsx` — export options (CSV, PDF, JSON, share link)
- `DishForm.tsx` — add/edit dish form
- `DishList.tsx` — dish library list with search and filters
- `DishCsvImport.tsx` — CSV import UI with preview
- `TagManager.tsx` — tag CRUD in settings
- `TagPicker.tsx` — multi-select tag picker in dish form
- `DateSelect.tsx` — day/month/year dropdown selects

#### Entry points
- `src/main.tsx` — React root, FOUC prevention (theme from localStorage before render; `index.html` also carries an inline `html{background:#191512}` so the first paint is never white)
- `src/App.tsx` — routes, WelcomeModal, NavBar

## Git

- Push with `git push origin main`
- CI runs on every push and PR via `.github/workflows/ci.yml` (unit tests only)
- Pushes to `main` also trigger `.github/workflows/deploy.yml` (tests + build + GitHub Pages deploy)
