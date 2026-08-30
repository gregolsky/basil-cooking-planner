import type { ReactNode } from 'react';

interface Props {
  value: number;
  capacity: number;
  label: string;
}

/**
 * Segment count = capacity (e.g. the day's difficulty cap); red-filled count = value
 * (e.g. the dish's difficulty). When value exceeds capacity, the excess renders as
 * distinct "overflow" segments past a divider, showing the dish going over budget.
 */
export function DifficultyBar({ value, capacity, label }: Props) {
  const total = Math.max(value, capacity);
  const hasOverflow = value > capacity;
  const nodes: ReactNode[] = [];
  for (let i = 0; i < total; i++) {
    if (hasOverflow && i === capacity) {
      nodes.push(<span key="cap" className="cap-mark" />);
    }
    const filled = i < value;
    const overflow = filled && i >= capacity;
    nodes.push(
      <span key={i} className={['seg', filled && 'filled', overflow && 'overflow'].filter(Boolean).join(' ')} />,
    );
  }
  return (
    <span className="difficulty-bar" role="img" aria-label={label}>
      {nodes}
    </span>
  );
}
