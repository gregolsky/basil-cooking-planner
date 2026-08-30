import { computeDifficultySegments } from '../lib/utils/difficultyBar';

interface Props {
  value: number;
  capacity: number;
  label: string;
}

/** Segment count = capacity, red-filled count = value; overflow renders past a divider. */
export function DifficultyBar({ value, capacity, label }: Props) {
  const segments = computeDifficultySegments(value, capacity);
  return (
    <span className="difficulty-bar" role="img" aria-label={label}>
      {segments.map((seg, i) =>
        seg.kind === 'divider'
          ? <span key={`divider-${i}`} className="cap-mark" />
          : <span key={i} className={['seg', seg.filled && 'filled', seg.overflow && 'overflow'].filter(Boolean).join(' ')} />,
      )}
    </span>
  );
}
