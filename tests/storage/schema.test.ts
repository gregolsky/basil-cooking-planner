import { describe, it, expect } from 'vitest';
import { appDataSchema, planSchema, dishSchema, SCHEMA_VERSION, migrateV1toV2 } from '../../src/lib/storage/schema';

const minimalAppData = {
  schemaVersion: SCHEMA_VERSION,
  dishes: [],
  plans: [],
  activePlanId: null,
};

describe('appDataSchema', () => {
  it('accepts minimal valid data', () => {
    expect(() => appDataSchema.parse(minimalAppData)).not.toThrow();
  });

  it('applies default empty array for tagDefinitions', () => {
    const parsed = appDataSchema.parse(minimalAppData);
    expect(parsed.tagDefinitions).toEqual([]);
  });

  it('rejects wrong schemaVersion', () => {
    expect(() => appDataSchema.parse({ ...minimalAppData, schemaVersion: 99 })).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => appDataSchema.parse({})).toThrow();
  });
});

describe('planSchema', () => {
  const minimalPlan = {
    id: 'p1',
    createdAt: '2026-04-20T00:00:00.000Z',
    startDate: '2026-04-20',
    endDate: '2026-04-26',
    meals: [],
    fitness: 0,
    violations: [],
  };

  it('applies default empty arrays for dayModifiers and cumulativeLimits', () => {
    const parsed = planSchema.parse(minimalPlan);
    expect(parsed.dayModifiers).toEqual([]);
    expect(parsed.cumulativeLimits).toEqual([]);
  });

  it('preserves dayModifiers and cumulativeLimits when provided', () => {
    const parsed = planSchema.parse({
      ...minimalPlan,
      dayModifiers: [{ date: '2026-04-21', difficultyCap: 2 }],
      cumulativeLimits: [{ id: 'cl1', startDate: '2026-04-20', endDate: '2026-04-26', maxTotal: 10 }],
    });
    expect(parsed.dayModifiers).toHaveLength(1);
    expect(parsed.dayModifiers[0].difficultyCap).toBe(2);
    expect(parsed.cumulativeLimits).toHaveLength(1);
    expect(parsed.cumulativeLimits[0].maxTotal).toBe(10);
  });
});

describe('dishSchema', () => {
  const validDish = {
    id: 'd1',
    name: 'Kotlet',
    meat: 'pork',
    difficulty: 3,
    preference: 5,
    servesDays: 1,
  };

  it('accepts a valid dish', () => {
    expect(() => dishSchema.parse(validDish)).not.toThrow();
  });

  it('applies default empty tags array', () => {
    const parsed = dishSchema.parse(validDish);
    expect(parsed.tags).toEqual([]);
  });

  it('rejects invalid meat type', () => {
    expect(() => dishSchema.parse({ ...validDish, meat: 'kangaroo' })).toThrow();
  });

  it('rejects difficulty out of range', () => {
    expect(() => dishSchema.parse({ ...validDish, difficulty: 0 })).toThrow();
    expect(() => dishSchema.parse({ ...validDish, difficulty: 6 })).toThrow();
  });

  it('rejects empty name', () => {
    expect(() => dishSchema.parse({ ...validDish, name: '' })).toThrow();
  });
});

describe('migrateV1toV2', () => {
  const v1Data = {
    schemaVersion: 1,
    familyName: 'Kowalski',
    dishes: [],
    dayModifiers: [
      { date: '2026-05-05', difficultyCap: 2 },
      { date: '2026-05-12', difficultyCap: 1 },
    ],
    cumulativeLimits: [
      { id: 'cl1', startDate: '2026-05-04', endDate: '2026-05-10', maxTotal: 15 },
    ],
    plans: [
      {
        id: 'p1',
        createdAt: '2026-05-01T00:00:00.000Z',
        startDate: '2026-05-04',
        endDate: '2026-05-10',
        meals: [],
        fitness: 0,
        violations: [],
      },
    ],
    activePlanId: 'p1',
  };

  it('bumps schemaVersion to 2', () => {
    const result = migrateV1toV2(v1Data) as Record<string, unknown>;
    expect(result['schemaVersion']).toBe(2);
  });

  it('removes top-level dayModifiers and cumulativeLimits', () => {
    const result = migrateV1toV2(v1Data) as Record<string, unknown>;
    expect(result['dayModifiers']).toBeUndefined();
    expect(result['cumulativeLimits']).toBeUndefined();
  });

  it('distributes dayModifiers into matching plans by date overlap', () => {
    const result = migrateV1toV2(v1Data) as Record<string, unknown>;
    const plans = result['plans'] as Array<Record<string, unknown>>;
    const plan = plans[0];
    const mods = plan['dayModifiers'] as Array<Record<string, unknown>>;
    // '2026-05-05' is within May 4-10 plan
    expect(mods.some((m) => m['date'] === '2026-05-05')).toBe(true);
    // '2026-05-12' is outside May 4-10 plan
    expect(mods.some((m) => m['date'] === '2026-05-12')).toBe(false);
  });

  it('distributes cumulativeLimits into overlapping plans', () => {
    const result = migrateV1toV2(v1Data) as Record<string, unknown>;
    const plans = result['plans'] as Array<Record<string, unknown>>;
    const plan = plans[0];
    const limits = plan['cumulativeLimits'] as Array<Record<string, unknown>>;
    expect(limits).toHaveLength(1);
    expect(limits[0]['id']).toBe('cl1');
  });

  it('passes through non-v1 data unchanged', () => {
    const v2Data = { schemaVersion: 2, plans: [] };
    expect(migrateV1toV2(v2Data)).toBe(v2Data);
  });

  it('passes through non-object values unchanged', () => {
    expect(migrateV1toV2(null)).toBeNull();
    expect(migrateV1toV2('string')).toBe('string');
  });

  it('migrated data passes appDataSchema validation', () => {
    const migrated = migrateV1toV2(v1Data);
    expect(() => appDataSchema.parse(migrated)).not.toThrow();
  });
});
