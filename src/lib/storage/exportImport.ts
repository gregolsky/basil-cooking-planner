import { deflate, inflate } from 'pako';
import { appDataSchema, SCHEMA_VERSION } from './schema';
import type { AppData } from './schema';

export function buildAppData(state: {
  familyName: string | null;
  weekStartDay: 0 | 1;
  dishes: AppData['dishes'];
  dayModifiers: AppData['dayModifiers'];
  plans: AppData['plans'];
  activePlanId: string | null;
  tagDefinitions: AppData['tagDefinitions'];
  cumulativeLimits: AppData['cumulativeLimits'];
}): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    familyName: state.familyName,
    weekStartDay: state.weekStartDay,
    dishes: state.dishes,
    dayModifiers: state.dayModifiers,
    plans: state.plans,
    activePlanId: state.activePlanId,
    tagDefinitions: state.tagDefinitions,
    cumulativeLimits: state.cumulativeLimits,
  };
}

export function exportJson(data: AppData): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: 'application/json' });
}

export async function parseJson(file: File | Blob | string): Promise<AppData> {
  const text = typeof file === 'string' ? file : await file.text();
  const raw = JSON.parse(text);
  return appDataSchema.parse(raw);
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function encodeLink(data: AppData): string {
  const json = JSON.stringify(data);
  const compressed = deflate(new TextEncoder().encode(json));
  return b64urlEncode(compressed);
}

export function decodeLink(encoded: string): AppData {
  const compressed = b64urlDecode(encoded);
  const inflated = inflate(compressed);
  const json = new TextDecoder().decode(inflated);
  return appDataSchema.parse(JSON.parse(json));
}

export function makeShareUrl(encoded: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = typeof window !== 'undefined' ? window.location.pathname : '/';
  return `${origin}${base}#/import?d=${encoded}`;
}
