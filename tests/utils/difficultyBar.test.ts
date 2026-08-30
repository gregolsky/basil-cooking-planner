import { describe, it, expect } from 'vitest';
import { computeDifficultySegments } from '../../src/lib/utils/difficultyBar';

describe('computeDifficultySegments', () => {
  it('renders value filled out of capacity segments when value is within capacity', () => {
    const segs = computeDifficultySegments(2, 3);
    expect(segs).toEqual([
      { kind: 'segment', filled: true, overflow: false },
      { kind: 'segment', filled: true, overflow: false },
      { kind: 'segment', filled: false, overflow: false },
    ]);
  });

  it('renders all segments filled and none overflowing when value equals capacity', () => {
    const segs = computeDifficultySegments(3, 3);
    expect(segs).toHaveLength(3);
    expect(segs.every((s) => s.kind === 'segment' && s.filled && !s.overflow)).toBe(true);
  });

  it('inserts a divider and marks the excess as overflow when value exceeds capacity', () => {
    const segs = computeDifficultySegments(4, 3);
    expect(segs).toEqual([
      { kind: 'segment', filled: true, overflow: false },
      { kind: 'segment', filled: true, overflow: false },
      { kind: 'segment', filled: true, overflow: false },
      { kind: 'divider' },
      { kind: 'segment', filled: true, overflow: true },
    ]);
  });

  it('handles value of 0 as an all-empty track of length capacity', () => {
    const segs = computeDifficultySegments(0, 5);
    expect(segs).toHaveLength(5);
    expect(segs.every((s) => s.kind === 'segment' && !s.filled && !s.overflow)).toBe(true);
  });

  it('handles capacity of 0 by rendering only overflow segments with no divider before them', () => {
    const segs = computeDifficultySegments(2, 0);
    expect(segs).toEqual([
      { kind: 'divider' },
      { kind: 'segment', filled: true, overflow: true },
      { kind: 'segment', filled: true, overflow: true },
    ]);
  });

  it('renders nothing when both value and capacity are 0', () => {
    expect(computeDifficultySegments(0, 0)).toEqual([]);
  });
});
