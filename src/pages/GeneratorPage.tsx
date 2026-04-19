import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { toISODate, addDays, daysBetween, listDates, formatShortPl, weekdayShortPl } from '../lib/utils/date';
import { buildDayContexts } from '../lib/days/capacity';
import { uid } from '../lib/utils/id';
import { GenerateDialog } from '../components/GenerateDialog';
import { DateSelect } from '../components/DateSelect';
import type { Plan, PlannedMeal } from '../types/plan';
import type { CumulativeLimit } from '../types/day';
import { runGAInWorker } from '../lib/ga/runner';

function defaultStart(): string {
  return toISODate(new Date());
}

function defaultEnd(): string {
  return addDays(defaultStart(), 13);
}

export function GeneratorPage() {
  const navigate = useNavigate();
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const upsertDayModifier = useAppStore((s) => s.upsertDayModifier);
  const clearDayModifier = useAppStore((s) => s.clearDayModifier);
  const cumulativeLimits = useAppStore((s) => s.cumulativeLimits);
  const upsertCumulativeLimit = useAppStore((s) => s.upsertCumulativeLimit);
  const deleteCumulativeLimit = useAppStore((s) => s.deleteCumulativeLimit);
  const addPlan = useAppStore((s) => s.addPlan);

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [name, setName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState({ generation: 0, bestFitness: 0, totalGenerations: 0 });
  const [abortFn, setAbortFn] = useState<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newLimitStart, setNewLimitStart] = useState('');
  const [newLimitEnd, setNewLimitEnd] = useState('');
  const [newLimitMax, setNewLimitMax] = useState<number | ''>('');

  const rangeDays = useMemo(() => {
    if (!start || !end) return 0;
    const n = daysBetween(start, end);
    return n >= 0 ? n + 1 : 0;
  }, [start, end]);

  useEffect(() => {
    if (end < start) setEnd(start);
  }, [start, end]);

  const handleGenerate = async () => {
    if (dishes.length === 0) {
      setError('Dodaj dania w bibliotece, zanim wygenerujesz plan.');
      return;
    }
    if (rangeDays <= 0) {
      setError('Data końcowa musi być równa lub późniejsza niż początkowa.');
      return;
    }
    setError(null);
    setDialogOpen(true);
    setProgress({ generation: 0, bestFitness: 0, totalGenerations: 200 });

    const dates = listDates(start, end);
    const days = buildDayContexts(dates, dayModifiers);

    const { promise, abort } = runGAInWorker({
      dishes,
      days,
      lockedMeals: [],
      cumulativeLimits,
      onProgress: (p) => setProgress(p),
    });
    setAbortFn(() => abort);

    try {
      const result = await promise;
      const plan: Plan = {
        id: uid(),
        name: name.trim() || undefined,
        createdAt: new Date().toISOString(),
        startDate: start,
        endDate: end,
        meals: result.meals as PlannedMeal[],
        fitness: result.fitness,
        violations: result.violations,
      };
      addPlan(plan);
      setDialogOpen(false);
      setAbortFn(null);
      navigate('/');
    } catch (e) {
      setError(String(e));
      setDialogOpen(false);
      setAbortFn(null);
    }
  };

  const handleAbort = () => {
    abortFn?.();
    setDialogOpen(false);
    setAbortFn(null);
  };

  return (
    <div className="page">
      <div className="page-header"><h1>✨ Nowy plan</h1></div>
      <div className="card stack">
        <label>
          Nazwa planu (opcjonalnie)
          <input
            type="text"
            value={name}
            placeholder="np. Tydzień 17 kwietnia"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <label>
            Data początkowa
            <DateSelect value={start} onChange={setStart} />
          </label>
          <label>
            Data końcowa
            <DateSelect value={end} onChange={setEnd} />
          </label>
        </div>
        <div className="muted">
          Zakres: {rangeDays > 0 ? `${rangeDays} dni` : 'nieprawidłowy'}.
          Plany mogą się nakładać zakresami — to nie jest błąd.
        </div>

        {rangeDays > 0 && (
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Limity trudności dni</summary>
            <div style={{ marginTop: 10, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #c7b79d' }}>Dzień</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px', borderBottom: '1px solid #c7b79d' }}>Limit trudności</th>
                  </tr>
                </thead>
                <tbody>
                  {listDates(start, end).map((date) => {
                    const mod = dayModifiers.find((m) => m.date === date);
                    const cap = mod?.difficultyCap;

                    const save = (newCap: number | undefined) => {
                      const next = { ...(mod ?? { date }), difficultyCap: newCap };
                      const isEmpty = !next.wifeDuty && next.difficultyCap === undefined && !next.skip && !next.requiresTags?.length && !next.note;
                      if (isEmpty) clearDayModifier(date);
                      else upsertDayModifier(next as typeof mod & { date: string });
                    };

                    return (
                      <tr key={date} style={{ borderBottom: '1px solid #ede3d3' }}>
                        <td style={{ padding: '4px 8px' }}>{weekdayShortPl(date)} {formatShortPl(date)}</td>
                        <td style={{ textAlign: 'center', padding: '4px 8px' }}>
                          <select
                            value={cap ?? ''}
                            style={{ fontSize: 13 }}
                            onChange={(e) => save(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">auto</option>
                            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {rangeDays > 0 && (
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Sumaryczne limity trudności</summary>
            <div style={{ marginTop: 10 }} className="stack">
              {cumulativeLimits.length === 0 && (
                <div className="muted" style={{ fontSize: 13 }}>Brak limitów — dodaj poniżej.</div>
              )}
              {cumulativeLimits.map((lim) => (
                <div key={lim.id} className="row" style={{ fontSize: 13, alignItems: 'center' }}>
                  <span style={{ flexGrow: 1 }}>
                    {formatShortPl(lim.startDate)} – {formatShortPl(lim.endDate)}: maks. suma <strong>{lim.maxTotal}</strong>
                  </span>
                  <button
                    className="small danger"
                    onClick={() => deleteCumulativeLimit(lim.id)}
                  >
                    Usuń
                  </button>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #c7b79d', paddingTop: 8 }} className="stack">
                <div style={{ fontWeight: 600, fontSize: 13 }}>Dodaj nowy limit</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                  <label style={{ fontSize: 13 }}>
                    Od
                    <DateSelect
                      value={newLimitStart || start}
                      onChange={setNewLimitStart}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Do
                    <DateSelect
                      value={newLimitEnd || end}
                      onChange={setNewLimitEnd}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Maks. suma trudności
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={newLimitMax}
                      onChange={(e) => setNewLimitMax(e.target.value ? Number(e.target.value) : '')}
                      style={{ width: 70, fontSize: 13 }}
                    />
                  </label>
                  <button
                    style={{ fontSize: 13 }}
                    disabled={!newLimitMax || Number(newLimitMax) < 1}
                    onClick={() => {
                      const lim: CumulativeLimit = {
                        id: uid(),
                        startDate: newLimitStart || start,
                        endDate: newLimitEnd || end,
                        maxTotal: Number(newLimitMax),
                      };
                      upsertCumulativeLimit(lim);
                      setNewLimitMax('');
                    }}
                  >
                    Dodaj
                  </button>
                </div>
              </div>
            </div>
          </details>
        )}

        {error && <div className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{error}</div>}

        <div className="row">
          <div className="spacer" />
          <button onClick={handleGenerate} disabled={rangeDays <= 0 || dishes.length === 0}>
            Generuj plan
          </button>
        </div>
      </div>

      {dialogOpen && (
        <GenerateDialog progress={progress} onAbort={handleAbort} />
      )}
    </div>
  );
}
