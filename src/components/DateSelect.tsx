const MONTHS = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  id?: string;
}

export function DateSelect({ value, onChange, id }: Props) {
  const [y, m, d] = value ? value.split('-').map(Number) : [new Date().getFullYear(), 1, 1];
  const maxDay = daysInMonth(y, m);

  const set = (year: number, month: number, day: number) => {
    const safeDay = Math.min(day, daysInMonth(year, month));
    onChange(`${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <span className="row" style={{ gap: 4 }} id={id}>
      <select
        value={d}
        onChange={(e) => set(y, m, Number(e.target.value))}
        style={{ width: 58 }}
        aria-label="dzień"
      >
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{String(n).padStart(2, '0')}</option>
        ))}
      </select>
      <select
        value={m}
        onChange={(e) => set(y, Number(e.target.value), d)}
        style={{ width: 130 }}
        aria-label="miesiąc"
      >
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={y}
        onChange={(e) => set(Number(e.target.value), m, d)}
        style={{ width: 76 }}
        aria-label="rok"
      >
        {years.map((yr) => (
          <option key={yr} value={yr}>{yr}</option>
        ))}
      </select>
    </span>
  );
}
