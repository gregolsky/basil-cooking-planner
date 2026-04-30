import { describe, it, expect } from 'vitest';
import { duplicatePlanData } from '../../src/lib/plan/duplicate';
import type { Plan } from '../../src/types/plan';

const sourcePlan: Plan = {
  id: 'original-id',
  name: 'Tydzień 1',
  createdAt: '2026-04-20T00:00:00.000Z',
  startDate: '2026-04-20',
  endDate: '2026-04-26',
  fitness: 120,
  violations: [{ date: '2026-04-21', severity: 'soft', kind: 'repeat', message: 'Powtórzenie' }],
  meals: [
    { date: '2026-04-20', dishId: 'kotlet', isLeftover: false, locked: false },
    { date: '2026-04-21', dishId: 'rosol', isLeftover: false, locked: true },
  ],
  dayModifiers: [
    { date: '2026-04-21', difficultyCap: 2, requiresTags: ['tag-a', 'tag-b'] },
    { date: '2026-04-22', skip: true },
  ],
  cumulativeLimits: [
    { id: 'cl1', startDate: '2026-04-20', endDate: '2026-04-26', maxTotal: 15 },
  ],
};

describe('duplicatePlanData', () => {
  it('generates a new id different from the source', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    expect(copy.id).not.toBe(sourcePlan.id);
  });

  it('appends suffix to the plan name', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    expect(copy.name).toBe('Tydzień 1 kopia');
  });

  it('uses "Plan" when source has no name', () => {
    const unnamed = { ...sourcePlan, name: undefined };
    const copy = duplicatePlanData(unnamed, 'kopia');
    expect(copy.name).toBe('Plan kopia');
  });

  it('deep-copies meals so mutations do not affect source', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    copy.meals[0].dishId = 'changed';
    expect(sourcePlan.meals[0].dishId).toBe('kotlet');
  });

  it('deep-copies violations so mutations do not affect source', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    copy.violations[0].message = 'changed';
    expect(sourcePlan.violations[0].message).toBe('Powtórzenie');
  });

  it('deep-copies dayModifiers so mutations do not affect source', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    expect(copy.dayModifiers).toHaveLength(2);
    copy.dayModifiers![0].difficultyCap = 99;
    expect(sourcePlan.dayModifiers![0].difficultyCap).toBe(2);
  });

  it('deep-copies requiresTags arrays in dayModifiers', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    copy.dayModifiers![0].requiresTags!.push('tag-new');
    expect(sourcePlan.dayModifiers![0].requiresTags).toHaveLength(2);
  });

  it('deep-copies cumulativeLimits so mutations do not affect source', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    expect(copy.cumulativeLimits).toHaveLength(1);
    copy.cumulativeLimits![0].maxTotal = 999;
    expect(sourcePlan.cumulativeLimits![0].maxTotal).toBe(15);
  });

  it('produces empty arrays when source has no dayModifiers or cumulativeLimits', () => {
    const minimal = { ...sourcePlan, dayModifiers: undefined, cumulativeLimits: undefined };
    const copy = duplicatePlanData(minimal, 'kopia');
    expect(copy.dayModifiers).toEqual([]);
    expect(copy.cumulativeLimits).toEqual([]);
  });

  it('preserves all other plan fields', () => {
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    expect(copy.startDate).toBe(sourcePlan.startDate);
    expect(copy.endDate).toBe(sourcePlan.endDate);
    expect(copy.fitness).toBe(sourcePlan.fitness);
    expect(copy.meals).toHaveLength(sourcePlan.meals.length);
  });

  it('sets a new createdAt timestamp', () => {
    const before = new Date().toISOString();
    const copy = duplicatePlanData(sourcePlan, 'kopia');
    expect(copy.createdAt >= before).toBe(true);
    expect(copy.createdAt > sourcePlan.createdAt).toBe(true);
  });
});
