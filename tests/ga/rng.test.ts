import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../src/lib/ga/rng';

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(r1.next()).toBe(r2.next());
    }
  });

  it('produces different sequences for different seeds', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(99);
    const seq1 = Array.from({ length: 5 }, () => r1.next());
    const seq2 = Array.from({ length: 5 }, () => r2.next());
    expect(seq1).not.toEqual(seq2);
  });

  it('next() always returns a value in [0, 1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int(1) always returns 0', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 20; i++) {
      expect(rng.int(1)).toBe(0);
    }
  });

  it('int(max) always returns a value in [0, max)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('pick on single-element array always returns that element', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng.pick(['only'])).toBe('only');
    }
  });

  it('pick distributes across array elements', () => {
    const rng = mulberry32(42);
    const arr = ['a', 'b', 'c'];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 300; i++) counts[rng.pick(arr)]++;
    // Each element should appear at least once with 300 samples
    expect(counts.a).toBeGreaterThan(0);
    expect(counts.b).toBeGreaterThan(0);
    expect(counts.c).toBeGreaterThan(0);
  });
});
