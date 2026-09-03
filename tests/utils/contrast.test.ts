import { describe, it, expect } from 'vitest';
import { contrastRatio, meetsAA } from '../../src/lib/utils/contrast';

describe('contrastRatio', () => {
  it('returns 21 for black against white, the maximum possible ratio', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('returns 1 for identical colors, the minimum possible ratio', () => {
    expect(contrastRatio('#A5202E', '#A5202E')).toBeCloseTo(1, 5);
  });

  it('is symmetric regardless of argument order', () => {
    const a = contrastRatio('#191512', '#F2EEE4');
    const b = contrastRatio('#F2EEE4', '#191512');
    expect(a).toBeCloseTo(b, 10);
  });

  it('computes the palette ink-on-ground ratio above AA for body text', () => {
    const ratio = contrastRatio('#F2EEE4', '#191512');
    expect(meetsAA(ratio)).toBe(true);
  });
});

describe('meetsAA', () => {
  it('requires 4.5:1 for normal text', () => {
    expect(meetsAA(4.4)).toBe(false);
    expect(meetsAA(4.5)).toBe(true);
  });

  it('requires only 3:1 for large text or UI boundaries', () => {
    expect(meetsAA(2.9, true)).toBe(false);
    expect(meetsAA(3, true)).toBe(true);
  });
});
