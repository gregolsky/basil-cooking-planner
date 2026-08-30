interface Props {
  value: number;
  max?: number;
  label: string;
}

/** Renders a 1..max value as filled/unfilled horizontal segments, e.g. difficulty 3 of 5. */
export function DifficultyBar({ value, max = 5, label }: Props) {
  const segments = Array.from({ length: max }, (_, i) => i < value);
  return (
    <span className="difficulty-bar" role="img" aria-label={label}>
      {segments.map((filled, i) => (
        <span key={i} className={filled ? 'seg filled' : 'seg'} />
      ))}
    </span>
  );
}
