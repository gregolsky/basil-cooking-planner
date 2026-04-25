import { describe, it, expect } from 'vitest';
import { appDataSchema, dishSchema, SCHEMA_VERSION } from '../../src/lib/storage/schema';

const minimalAppData = {
  schemaVersion: SCHEMA_VERSION,
  dishes: [],
  dayModifiers: [],
  plans: [],
  activePlanId: null,
};

describe('appDataSchema', () => {
  it('accepts minimal valid data', () => {
    expect(() => appDataSchema.parse(minimalAppData)).not.toThrow();
  });

  it('applies default empty arrays for optional collections', () => {
    const parsed = appDataSchema.parse(minimalAppData);
    expect(parsed.tagDefinitions).toEqual([]);
    expect(parsed.cumulativeLimits).toEqual([]);
  });

  it('rejects wrong schemaVersion', () => {
    expect(() => appDataSchema.parse({ ...minimalAppData, schemaVersion: 99 })).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => appDataSchema.parse({})).toThrow();
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
