import { test, expect, type Page } from '@playwright/test';

const LOCALSTORAGE_KEY = 'family-cooking-planner';

type SeedDish = {
  name: string;
  meat: 'beef' | 'pork' | 'poultry' | 'fish' | 'none';
  difficulty: '1' | '2' | '3' | '4' | '5';
  preference: '1' | '2' | '3' | '4' | '5';
  prepTimeMin: number;
  servesDays: '1' | '2' | '3';
};

const SEED_DISHES: SeedDish[] = [
  { name: 'Kotlet schabowy',     meat: 'pork',    difficulty: '3', preference: '5', prepTimeMin: 45, servesDays: '1' },
  { name: 'Rosół z makaronem',   meat: 'poultry', difficulty: '2', preference: '4', prepTimeMin: 90, servesDays: '2' },
  { name: 'Ryba z pieca',        meat: 'fish',    difficulty: '2', preference: '3', prepTimeMin: 30, servesDays: '1' },
  { name: 'Makaron z sosem',     meat: 'none',    difficulty: '1', preference: '5', prepTimeMin: 20, servesDays: '1' },
  { name: 'Gulasz wołowy',       meat: 'beef',    difficulty: '4', preference: '3', prepTimeMin: 120, servesDays: '2' },
  { name: 'Pieczony kurczak',    meat: 'poultry', difficulty: '3', preference: '5', prepTimeMin: 60, servesDays: '1' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.removeItem(key);
  }, LOCALSTORAGE_KEY);
});

async function addDish(page: Page, d: SeedDish) {
  await page.getByRole('button', { name: '+ Dodaj danie' }).click();
  await page.getByLabel('Nazwa dania').fill(d.name);
  await page.getByLabel('Rodzaj mięsa').selectOption(d.meat);
  await page.getByLabel('Trudność (1-5)').selectOption(d.difficulty);
  await page.getByLabel('Czas przygotowania (min)').fill(String(d.prepTimeMin));
  await page.getByLabel('Preferencja (1-5)').selectOption(d.preference);
  await page.getByLabel('Starcza na').selectOption(d.servesDays);
  await page.getByRole('button', { name: 'Zapisz' }).click();
}

test('add dishes, generate plan, verify calendar renders filled days', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Kalendarz' })).toBeVisible();

  await page.getByRole('link', { name: 'Dania' }).click();
  await expect(page.getByRole('heading', { name: 'Biblioteka dań' })).toBeVisible();

  for (const d of SEED_DISHES) {
    await addDish(page, d);
  }

  for (const d of SEED_DISHES) {
    await expect(page.getByText(d.name, { exact: true })).toBeVisible();
  }

  await page.getByRole('link', { name: 'Nowy plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nowy plan' })).toBeVisible();

  await page.getByLabel('Nazwa planu (opcjonalnie)').fill('E2E Smoke');
  await page.getByLabel('Data początkowa').fill('2026-05-04');
  await page.getByLabel('Data końcowa').fill('2026-05-10');

  await page.getByRole('button', { name: 'Generuj plan' }).click();

  await expect(page.getByRole('heading', { name: 'E2E Smoke' })).toBeVisible({ timeout: 60_000 });

  const dayCards = page.locator('.day-card');
  await expect(dayCards).toHaveCount(7);

  const dishNames = SEED_DISHES.map((d) => d.name);
  for (let i = 0; i < 7; i++) {
    const text = (await dayCards.nth(i).innerText()).toLowerCase();
    const matched = dishNames.some((n) => text.includes(n.toLowerCase()));
    expect(matched, `day-card ${i} should contain one of our dishes; got: ${text}`).toBe(true);
  }

  await page.getByRole('link', { name: 'Plany' }).click();
  await expect(page.getByText('E2E Smoke')).toBeVisible();
  await expect(page.getByText('7 dni')).toBeVisible();
});

test('pin dish to specific day via DayEditor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Dania' }).click();
  for (const d of SEED_DISHES.slice(0, 4)) {
    await addDish(page, d);
  }

  await page.getByRole('link', { name: 'Nowy plan', exact: true }).click();
  await page.getByLabel('Nazwa planu (opcjonalnie)').fill('Pin Test');
  await page.getByLabel('Data początkowa').fill('2026-05-04');
  await page.getByLabel('Data końcowa').fill('2026-05-06');
  await page.getByRole('button', { name: 'Generuj plan' }).click();

  await expect(page.getByRole('heading', { name: 'Pin Test' })).toBeVisible({ timeout: 60_000 });
  const dayCards = page.locator('.day-card');
  await expect(dayCards).toHaveCount(3);

  await dayCards.first().click();
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('heading', { name: 'Przypnij obiad' })).toBeVisible();

  await modal.getByRole('button', { name: /Ryba z pieca/ }).click();
  await modal.getByRole('button', { name: 'Gotowe' }).click();

  await expect(dayCards.first()).toContainText('Ryba z pieca');
  await expect(dayCards.first()).toContainText('📌');
});
