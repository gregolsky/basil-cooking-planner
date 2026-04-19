<div align="center">
  <img src="public/basil-logo.png" alt="Basil" height="120" />
  <h1>Basil — family cooking planner</h1>
  <p>Polish-language PWA for planning weekly family dinners</p>
  <a href="https://gregolsky.github.io/basil-cooking-planner/">🌿 Open app</a>
</div>

---

## Features

**Meal planning**
- Generate a meal schedule for any date range using a genetic algorithm
- Constraints: no same meat two days in a row, difficulty caps per day, nanny-friendly dishes
- Soft preferences: family ratings, dish variety, repeat penalties
- Pin any day manually — regeneration respects locked meals
- Swap dishes between days or mark a day as skip

**Calendar view**
- 7-column weekly grid with configurable first day of week (Mon/Sun)
- Weekends highlighted, meat type emoji next to dish name
- Per-day difficulty cap shown on each card
- Leftovers labelled and pinned to bottom of card

**Dish library**
- Full CRUD with meat type, difficulty (1–5), family preference (1–5), serves days (1–3)
- Tag system with optional per-week limits and minimum gap constraints
- Bulk import from CSV (Polish or English column names)

**Day modifiers**
- Set per-day difficulty cap overrides directly on the plan generator
- Modifiers persist and are respected by every regeneration

**Export & sharing**
- PDF (white background, Lobster title font, NotoSans for Polish characters)
- CSV (semicolon-separated, UTF-8 BOM, Excel-friendly)
- Full JSON backup — includes dishes, plans, tags, family name, settings
- Share via compressed URL or Web Share API (Android)
- Import JSON restores everything including settings

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

## Deploy

Pushes to `main` trigger GitHub Actions → builds → deploys to GitHub Pages.
