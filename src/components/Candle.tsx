interface Props {
  size?: number;
}

export function Candle({ size = 1 }: Props) {
  return (
    <span
      className="candle"
      aria-hidden="true"
      style={{ transform: `scale(${size})` }}
    >
      <span className="flame" />
      <span className="wick" />
      <span className="stick" />
    </span>
  );
}
