<div align="center">
  <img src="public/basil-logo.png" alt="Basil" height="120" />
  <h1>Basil — family cooking planner</h1>
  <p>Polish-language PWA for planning weekly family dinners</p>
  <a href="https://gregolsky.github.io/basil-cooking-planner/">🌿 Open app</a>
</div>

---

## How to use

### 1. Add dishes

Go to **Dania** (Dishes) and build your library. Each dish has:
- **Name** and **meat type** (pork, poultry, fish, beef, none)
- **Difficulty** (1–5) — how hard it is to cook
- **Preference** (1–5) — how much the family likes it
- **Serves days** (1–3) — a 2-day dish auto-generates a leftover day

You can also bulk-import from CSV (Polish or English column names).

### 2. Set up tags (optional)

In **Dane** (Settings) → **Etykiety** (Tags), create tags like "niania" (nanny), "zamawiane" (takeout). Tags can have rules:
- **Max per week** — e.g. nanny meals max 2×/week
- **Min gap days** — e.g. takeout at least every 14 days

Assign tags to dishes in the dish form.

### 3. Generate a plan

Go to **Nowy plan** (New plan), pick a date range, and click **Generuj**. The genetic algorithm runs in the background and produces an optimized meal schedule respecting all constraints. You can fine-tune per-day difficulty limits and cumulative difficulty budgets before generating.

### 4. Review and adjust

On the plan detail page:
- Click any day card to **pin a specific dish** or mark it as skip
- Click **✏️** next to the plan name to **rename** the plan
- Click **Regeneruj** — unlocked future days are regenerated, past days and pinned days stay
- Month boundaries are visually marked in the calendar

### 5. Continue a plan

Click **Kontynuuj** on any plan to create a follow-up. Select a date range from the source plan to carry over (those days become locked in the new plan), set the new end date, and generate.

### 6. Export and share

From the plan detail page, export as:
- **PDF** — print-friendly layout
- **CSV** — semicolon-separated, Excel-friendly
- **JSON** — full backup of all data (dishes, plans, tags, settings)
- **Share link** — compressed URL for sharing via messenger
- **Web Share API** — native share dialog on Android

---

## Features

**Meal planning**
- Genetic algorithm generates optimized schedules for any date range
- Hard constraints: no same meat two days in a row, difficulty caps, tag requirements, tag weekly limits, tag min gap
- Soft preferences: family ratings, dish variety, repeat penalties, meat diversity (Shannon entropy)
- Pin any day manually — regeneration respects locked meals
- Cumulative difficulty budgets for date ranges

**Calendar view**
- 7-column weekly grid with configurable first day of week (Mon/Sun)
- Weekends highlighted, meat type emoji next to dish name
- Month boundary banners with realigned grid
- Per-day difficulty cap shown on each card, leftovers labelled

**Dish library**
- Full CRUD with meat type, difficulty (1–5), family preference (1–5), serves days (1–3)
- Tag system with optional per-week limits and minimum gap constraints
- Bulk import from CSV (Polish or English column names)

**Plan continuation**
- Select any date range from a source plan to carry over
- Carried days are locked; GA generates the rest

**Day modifiers**
- Set per-day difficulty cap overrides directly on the plan generator
- Modifiers persist and are respected by every regeneration

**Export & sharing**
- PDF (white background, Lobster title font, NotoSans for Polish characters)
- CSV (semicolon-separated, UTF-8 BOM, Excel-friendly)
- Full JSON backup — includes dishes, plans, tags, family name, settings
- Share via compressed URL or Web Share API (Android)
- Import JSON restores everything including settings

**Themes**
- Trattoria della Famiglia (default) and PRL (Polish People's Republic canteen) — switchable in Settings

**PWA**
- Installable on Android and desktop
- Offline-capable (app shell + assets cached by service worker)

## Stack

- Vite 7 + React 19 + TypeScript
- Zustand (state), Zod (validation), React Router (hash routing)
- Web Worker + Comlink — GA runs off the main thread
- jsPDF + jspdf-autotable — PDF export
- pako — compressed share links
- vite-plugin-pwa — service worker, manifest

## Development

```bash
npm install
npm run dev        # http://localhost:5173/basil-cooking-planner/
npm test           # Vitest unit tests
npm run test:e2e   # Playwright e2e (needs app running)
npm run build
```

## Docs

- [Algorithm description](docs/algorithm.md) — how the genetic algorithm generates meal plans (with mermaid diagrams)

## Deploy

- Pushes to `main` trigger GitHub Actions → tests + build → deploys to GitHub Pages
- Tests also run on every PR via a separate CI workflow
