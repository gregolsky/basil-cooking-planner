import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  toISODate,
  addDays,
  daysBetween,
  listDates,
  formatPl,
  formatShortPl,
  weekdayShortPl,
} from '../lib/utils/date';
import { buildDayContexts } from '../lib/days/capacity';
import { uid } from '../lib/utils/id';
import { GenerateDialog } from '../components/GenerateDialog';
import { DateSelect } from '../components/DateSelect';
import type { Plan, PlannedMeal } from '../types/plan';
import type { CumulativeLimit } from '../types/day';
import { runGAInWorker } from '../lib/ga/runner';

export function ExtendPlanPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const sourcePlan = useAppStore((s) => s.plans.find((p) => p.id === id) ?? null);
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const upsertDayModifier = useAppStore((s) => s.upsertDayModifier);
  const clearDayModifier = useAppStore((s) => s.clearDayModifier);
  const cumulativeLimits = useAppStore((s) => s.cumulativeLimits);
  const upsertCumulativeLimit = useAppStore((s) => s.upsertCumulativeLimit);
  const deleteCumulativeLimit = useAppStore((s) => s.deleteCumulativeLimit);
  const addPlan = useAppStore((s) => s.addPlan);

  const planLength = sourcePlan ? sourcePlan.meals.length : 0;
  const defaultCarry = Math.min(3, planLength);
  const [carryDays, setCarryDays] = useState(defaultCarry);
  const [end, setEnd] = useState(() =>
    sourcePlan ? addDays(sourcePlan.endDate, 7) : toISODate(new Date()),
  );
  const [name, setName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState({ generation: 0, bestFitness: 0, totalGenerations: 200 });
  const [abortFn, setAbortFn] = useState<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newLimitStart, setNewLimitStart] = useState('');
  const [newLimitEnd, setNewLimitEnd] = useState('');
  const [newLimitMax, setNewLimitMax] = useState<number | ''>('');

  const start = useMemo(() => {
    if (!sourcePlan) return '';
    const n = Math.max(1, Math.min(carryDays, planLength));
    return addDays(sourcePlan.endDate, -(n - 1));
  }, [sourcePlan, carryDays, planLength]);

  const rangeDays = useMemo(() => {
    if (!start || !end) return 0;
    const n = daysBetween(start, end);
    return n >= 0 ? n + 1 : 0;
  }, [start, end]);

  const newDays = rangeDays - carryDays;

  if (!sourcePlan) {
    return (
      <div className="page">
        <div className="page-header"><h1>➕ Przedłuż plan</h1></div>
        <div className="card empty-state">
          Nie znaleziono planu. <Link to="/plans">Wróć do listy planów</Link>.
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (dishes.length === 0) {
      setError('Dodaj dania w bibliotece, zanim wygenerujesz plan.');
      return;
    }
    if (newDays <= 0) {
      setError('Data końcowa musi być co najmniej 1 dzień po końcu źródłowego planu.');
      return;
    }
    setError(null);
    setDialogOpen(true);
    setProgress({ generation: 0, bestFitness: 0, totalGenerations: 200 });

    const clampedCarry = Math.max(1, Math.min(carryDays, planLength));
    const lockedMeals: PlannedMeal[] = sourcePlan.meals
      .slice(-clampedCarry)
      .map((m) => ({ ...m, locked: true }));

    const dates = listDates(start, end);
    const days = buildDayContexts(dates, dayModifiers);

    const { promise, abort } = runGAInWorker({
      dishes,
      days,
      lockedMeals,
      cumulativeLimits,
      onProgress: (p) => setProgress(p),
    });
    setAbortFn(() => abort);

    try {
      const result = await promise;
      const defaultName = `${sourcePlan.name ?? 'Plan'} (kontynuacja)`;
      const plan: Plan = {
        id: uid(),
        name: name.trim() || defaultName,
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
      navigate('/plans');
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

  const canGenerate = newDays > 0 && dishes.length > 0;

  return (
    <div className="page">
      <div className="page-header"><h1>➕ Przedłuż plan</h1></div>
      <div className="card stack">
        <div className="muted">
          Źródło: <strong>{sourcePlan.name ?? `Plan ${formatPl(sourcePlan.startDate)}`}</strong>
          {' '}· {formatPl(sourcePlan.startDate)} – {formatPl(sourcePlan.endDate)}
          {' '}· {planLength} dni
        </div>

        <label>
          Liczba dni do przeniesienia
          <input
            type="number"
            min={1}
            max={planLength}
            value={carryDays}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v >= 1 && v <= planLength) setCarryDays(v);
            }}
            style={{ width: 80 }}
          />
          <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>
            (ostatnie {carryDays} {carryDays === 1 ? 'dzień' : 'dni'} zostaną zablokowane)
          </span>
        </label>

        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <label>
            Data początkowa (wyznaczona)
            <div className="muted" style={{ padding: '6px 0', fontWeight: 600 }}>
              {start ? `${weekdayShortPl(start)} ${formatShortPl(start)}` : '—'}
            </div>
          </label>
          <label>
            Data końcowa
            <div className="row" style={{ gap: 6, alignItems: 'center' }}>
              <DateSelect value={end} onChange={setEnd} />
              <span className="muted" style={{ fontSize: 13 }}>{end ? weekdayShortPl(end) : ''}</span>
            </div>
          </label>
        </div>

        <div className="muted">
          {rangeDays > 0
            ? `Zakres: ${rangeDays} dni (${carryDays} przeniesione + ${newDays > 0 ? newDays : 0} nowych).`
            : 'Nieprawidłowy zakres.'}
        </div>

        <label>
          Nazwa planu (opcjonalnie)
          <input
            type="text"
            value={name}
            placeholder={`${sourcePlan.name ?? 'Plan'} (kontynuacja)`}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

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
                  <button className="small danger" onClick={() => deleteCumulativeLimit(lim.id)}>Usuń</button>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #c7b79d', paddingTop: 8 }} className="stack">
                <div style={{ fontWeight: 600, fontSize: 13 }}>Dodaj nowy limit</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                  <label style={{ fontSize: 13 }}>
                    Od
                    <DateSelect value={newLimitStart || start} onChange={setNewLimitStart} />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Do
                    <DateSelect value={newLimitEnd || end} onChange={setNewLimitEnd} />
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

        {error && (
          <div className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{error}</div>
        )}

        <div className="row">
          <div className="spacer" />
          <button onClick={handleGenerate} disabled={!canGenerate}>
            Generuj plan
          </button>
        </div>
      </div>

      {dialogOpen && <GenerateDialog progress={progress} onAbort={handleAbort} />}
    </div>
  );
}
