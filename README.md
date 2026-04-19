# Basil — family cooking planner

A Polish-language PWA for planning weekly family dinners. Generates meal schedules using a genetic algorithm, respects cooking constraints (nanny days, duty shifts, leftovers), and lets you pin/override any day manually.

**Live app:** https://gregolsky.github.io/cooking-plan/

## Features

- Genetic algorithm meal planner with configurable constraints
- Dish library with meat type, difficulty, cook role, and kids rating
- Multi-day leftover support
- Manual overrides (pin, swap, skip) that survive regeneration
- Violations audit panel (hard/soft constraint breaches)
- Export: CSV, PDF (with Lobster font), JSON backup
- Import / share via link (pako-compressed URL) or Web Share API
- PWA — installable, works offline
- Hosted on GitHub Pages

## Stack

- Vite + React 19 + TypeScript
- Zustand (state), Zod (schema validation), React Router (hash routing)
- Web Worker + Comlink (GA runs off main thread)
- jsPDF + jspdf-autotable (PDF export)
- vite-plugin-pwa (service worker, manifest)

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:5173/cooking-plan/
npm test           # Vitest unit tests
npm run test:e2e   # Playwright e2e tests (needs app running)
npm run build      # production build → dist/
```

## Deploy

Pushes to `main` trigger the GitHub Actions workflow which builds and deploys to GitHub Pages automatically.
