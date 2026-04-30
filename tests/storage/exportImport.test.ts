import { describe, it, expect } from 'vitest';
import {
  buildAppData,
  encodeLink,
  decodeLink,
  parseJson,
  makeShareUrl,
} from '../../src/lib/storage/exportImport';
import { SCHEMA_VERSION } from '../../src/lib/storage/schema';

const baseState = {
  familyName: 'Rodzina Kowalskich',
  weekStartDay: 1 as const,
  dishes: [],
  plans: [],
  activePlanId: null,
  tagDefinitions: [],
};

describe('buildAppData', () => {
  it('sets the correct schemaVersion', () => {
    const data = buildAppData(baseState);
    expect(data.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('preserves all state fields', () => {
    const data = buildAppData(baseState);
    expect(data.familyName).toBe('Rodzina Kowalskich');
    expect(data.weekStartDay).toBe(1);
  });

  it('normalizes optional plan fields to empty arrays', () => {
    const state = {
      ...baseState,
      plans: [
        {
          id: 'p1',
          createdAt: '2026-04-20T00:00:00.000Z',
          startDate: '2026-04-20',
          endDate: '2026-04-26',
          meals: [],
          fitness: 0,
          violations: [],
          // dayModifiers and cumulativeLimits intentionally omitted
        },
      ],
    };
    const data = buildAppData(state);
    expect(data.plans[0].dayModifiers).toEqual([]);
    expect(data.plans[0].cumulativeLimits).toEqual([]);
  });
});

describe('encodeLink / decodeLink round-trip', () => {
  it('decoding an encoded AppData returns identical data', () => {
    const data = buildAppData(baseState);
    const encoded = encodeLink(data);
    const decoded = decodeLink(encoded);
    expect(decoded).toEqual(data);
  });

  it('produces a non-empty string', () => {
    const encoded = encodeLink(buildAppData(baseState));
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('uses URL-safe base64 (no + or /)', () => {
    const encoded = encodeLink(buildAppData(baseState));
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
  });
});

describe('parseJson', () => {
  it('parses valid JSON string into AppData', async () => {
    const data = buildAppData(baseState);
    const json = JSON.stringify(data);
    const parsed = await parseJson(json);
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('throws on invalid JSON', async () => {
    await expect(parseJson('not-json')).rejects.toThrow();
  });

  it('throws on valid JSON with wrong schema', async () => {
    await expect(parseJson(JSON.stringify({ schemaVersion: 99 }))).rejects.toThrow();
  });

  it('migrates v1 JSON (global dayModifiers) to v2 per-plan format', async () => {
    const v1Json = JSON.stringify({
      schemaVersion: 1,
      dishes: [],
      dayModifiers: [{ date: '2026-05-05', difficultyCap: 2 }],
      cumulativeLimits: [],
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
    });
    const parsed = await parseJson(v1Json);
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    const plan = parsed.plans[0];
    expect(plan.dayModifiers.some((m) => m.date === '2026-05-05')).toBe(true);
  });
});

describe('makeShareUrl', () => {
  it('includes the encoded payload in the hash', () => {
    const url = makeShareUrl('abc123');
    expect(url).toContain('#/import?d=abc123');
  });
});
