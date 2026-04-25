import { describe, it, expect } from 'vitest';
import { exportDishesToCsv, parseDishCsv } from '../../src/lib/csv/dishImport';
import { planToCsv } from '../../src/lib/csv/exporter';
import type { Dish } from '../../src/types/dish';
import type { Plan } from '../../src/types/plan';

const sampleDishes: Dish[] = [
  { id: 'd1', name: 'Kotlet schabowy', meat: 'pork', difficulty: 3, preference: 5, tags: [], servesDays: 1 },
  { id: 'd2', name: 'Rosół', meat: 'poultry', difficulty: 2, preference: 4, tags: [], servesDays: 2 },
];

describe('exportDishesToCsv', () => {
  it('output starts with UTF-8 BOM bytes (EF BB BF)', async () => {
    const blob = exportDishesToCsv(sampleDishes, new Map());
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // UTF-8 BOM = EF BB BF
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
  });

  it('round-trip: exported dishes can be parsed back', async () => {
    const blob = exportDishesToCsv(sampleDishes, new Map());
    const text = await blob.text();
    const { dishes, warnings } = parseDishCsv(text);
    expect(warnings).toHaveLength(0);
    expect(dishes).toHaveLength(sampleDishes.length);
    for (let i = 0; i < sampleDishes.length; i++) {
      expect(dishes[i].name).toBe(sampleDishes[i].name);
      expect(dishes[i].meat).toBe(sampleDishes[i].meat);
      expect(dishes[i].difficulty).toBe(sampleDishes[i].difficulty);
      expect(dishes[i].preference).toBe(sampleDishes[i].preference);
      expect(dishes[i].servesDays).toBe(sampleDishes[i].servesDays);
    }
  });

  it('dish name containing semicolon is quoted', async () => {
    const dishes: Dish[] = [
      { id: 'd1', name: 'Kotlet; schabowy', meat: 'pork', difficulty: 3, preference: 5, tags: [], servesDays: 1 },
    ];
    const blob = exportDishesToCsv(dishes, new Map());
    const text = await blob.text();
    expect(text).toContain('"Kotlet; schabowy"');
  });

  it('resolves tag IDs to names using tagMap', async () => {
    const tagMap = new Map([['tag-nanny', 'niania']]);
    const dishes: Dish[] = [
      { id: 'd1', name: 'Ryba', meat: 'fish', difficulty: 2, preference: 3, tags: ['tag-nanny'], servesDays: 1 },
    ];
    const blob = exportDishesToCsv(dishes, tagMap);
    const text = await blob.text();
    expect(text).toContain('niania');
  });
});

describe('planToCsv', () => {
  const dishMap = new Map<string, Dish>([
    ['d1', { id: 'd1', name: 'Kotlet schabowy', meat: 'pork', difficulty: 3, preference: 5, tags: [], servesDays: 1 }],
  ]);

  const simplePlan: Plan = {
    id: 'p1',
    name: 'Test',
    createdAt: '2026-04-25T00:00:00.000Z',
    startDate: '2026-04-20',
    endDate: '2026-04-21',
    fitness: 100,
    violations: [],
    meals: [
      { date: '2026-04-20', dishId: 'd1', isLeftover: false, locked: false },
      { date: '2026-04-21', dishId: null, isLeftover: false, locked: false },
    ],
  };

  it('output starts with UTF-8 BOM', () => {
    const csv = planToCsv(simplePlan, dishMap);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('contains header row', () => {
    const csv = planToCsv(simplePlan, dishMap);
    expect(csv).toContain('data');
    expect(csv).toContain('danie');
  });

  it('null dishId renders as (nie gotujemy)', () => {
    const csv = planToCsv(simplePlan, dishMap);
    expect(csv).toContain('(nie gotujemy)');
  });

  it('leftover meal shows tak in leftover column', () => {
    const plan: Plan = {
      ...simplePlan,
      meals: [{ date: '2026-04-20', dishId: 'd1', isLeftover: true, locked: false }],
    };
    const csv = planToCsv(plan, dishMap);
    expect(csv).toContain('tak');
  });

  it('locked meal shows tak in locked column', () => {
    const plan: Plan = {
      ...simplePlan,
      meals: [{ date: '2026-04-20', dishId: 'd1', isLeftover: false, locked: true }],
    };
    const csv = planToCsv(plan, dishMap);
    expect(csv).toContain('tak');
  });

  it('dish name with semicolon is escaped', () => {
    const dishMapWithSemi = new Map<string, Dish>([
      ['d2', { id: 'd2', name: 'Kotlet; schabowy', meat: 'pork', difficulty: 3, preference: 5, tags: [], servesDays: 1 }],
    ]);
    const plan: Plan = {
      ...simplePlan,
      meals: [{ date: '2026-04-20', dishId: 'd2', isLeftover: false, locked: false }],
    };
    const csv = planToCsv(plan, dishMapWithSemi);
    expect(csv).toContain('"Kotlet; schabowy"');
  });
});
