export type DifficultySegment =
  | { kind: 'divider' }
  | { kind: 'segment'; filled: boolean; overflow: boolean };

/**
 * Segment count = capacity (e.g. the day's difficulty cap); filled count = value
 * (e.g. the dish's difficulty). When value exceeds capacity, the excess is marked
 * `overflow` and a `divider` segment separates it from the capacity's own segments.
 */
export function computeDifficultySegments(value: number, capacity: number): DifficultySegment[] {
  const total = Math.max(value, capacity);
  const hasOverflow = value > capacity;
  const segments: DifficultySegment[] = [];
  for (let i = 0; i < total; i++) {
    if (hasOverflow && i === capacity) {
      segments.push({ kind: 'divider' });
    }
    const filled = i < value;
    const overflow = filled && i >= capacity;
    segments.push({ kind: 'segment', filled, overflow });
  }
  return segments;
}
