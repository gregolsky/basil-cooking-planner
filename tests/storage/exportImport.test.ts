import { describe, it, expect } from 'vitest';
import {
  buildAppData,
  encodeLink,
  decodeLink,
  parseJson,
  makeShareUrl,
} from '../../src/lib/storage/exportImport';
import { SCHEMA_VERSION } from '../../src/lib/storage/schema';
import type { AppData } from '../../src/lib/storage/schema';

const baseState = {
  familyName: 'Rodzina Kowalskich',
  weekStartDay: 1 as const,
  dishes: [],
  dayModifiers: [],
  plans: [],
  activePlanId: null,
  tagDefinitions: [],
  cumulativeLimits: [],
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
});

describe('makeShareUrl', () => {
  it('includes the encoded payload in the hash', () => {
    const url = makeShareUrl('abc123');
    expect(url).toContain('#/import?d=abc123');
  });
});
