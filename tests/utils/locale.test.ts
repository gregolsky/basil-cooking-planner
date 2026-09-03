import { describe, it, expect } from 'vitest';
import { resolveInitialLocale } from '../../src/lib/utils/locale';

describe('resolveInitialLocale', () => {
  it('maps English tags to en', () => {
    expect(resolveInitialLocale('en-GB')).toBe('en');
    expect(resolveInitialLocale('en')).toBe('en');
    expect(resolveInitialLocale('EN-US')).toBe('en');
  });

  it('maps Polish and unrecognized tags to pl', () => {
    expect(resolveInitialLocale('pl-PL')).toBe('pl');
    expect(resolveInitialLocale('de')).toBe('pl');
  });

  it('defaults to pl when nothing was detected', () => {
    expect(resolveInitialLocale(undefined)).toBe('pl');
  });
});
