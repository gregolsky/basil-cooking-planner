import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { formatPl, daysBetween } from '../lib/utils/date';
import { Calendar } from '../components/Calendar';
import { ViolationsPanel } from '../components/ViolationsPanel';
import { PlanSummary } from '../components/PlanSummary';
import { GenerateDialog } from '../components/GenerateDialog';
import { buildDayContexts } from '../lib/days/capacity';
import { listDates } from '../lib/utils/date';
import { runGAInWorker } from '../lib/ga/runner';
import type { Plan, PlannedMeal } from '../types/plan';

export function PlansListPage() {
  const plans = useAppStore((s) => s.plans);
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const duplicatePlan = useAppStore((s) => s.duplicatePlan);
  const updatePlan = useAppStore((s) => s.updatePlan);

  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ generation: 0, bestFitness: 0, totalGenerations: 200 });
  const [abortFn, setAbortFn] = useState<(() => void) | null>(null);

  const sorted = [...plans].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  const handleRegen = (plan: Plan) => {
    setRegenId(plan.id);
    setProgress({ generation: 0, bestFitness: 0, totalGenerations: 200 });

    const locked = plan.meals.filter((m) => m.locked);
    const dates = listDates(plan.startDate, plan.endDate);
    const days = buildDayContexts(dates, dayModifiers);

    const { promise, abort } = runGAInWorker({
      dishes,
      days,
      lockedMeals: locked,
      onProgress: (p) => setProgress(p),
    });
    setAbortFn(() => abort);

    promise.then((result) => {
      updatePlan(plan.id, (p) => ({
        ...p,
        meals: result.meals as PlannedMeal[],
        fitness: result.fitness,
        violations: result.violations,
      }));
      setRegenId(null);
      setAbortFn(null);
    }).catch(() => {
      setRegenId(null);
      setAbortFn(null);
    });
  };

  const handleAbort = () => {
    abortFn?.();
    setRegenId(null);
    setAbortFn(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📚 Plany</h1>
        <Link to="/new-plan"><button>+ Nowy plan</button></Link>
      </div>

      {sorted.length === 0 && (
        <div className="card empty-state">
          Brak planów. <Link to="/new-plan">Wygeneruj pierwszy plan</Link>.
        </div>
      )}

      <div className="stack">
        {sorted.map((p) => {
          const isExpanded = p.id === expandedId;
          const days = daysBetween(p.startDate, p.endDate) + 1;
          const hard = p.violations.filter((v) => v.severity === 'hard').length;

          return (
            <div key={p.id} className="card stack">
              <div className="row">
                <div className="grow">
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-red-dark)' }}>
                    {p.name ?? `Plan ${formatPl(p.startDate)}`}
                  </div>
                  <div className="muted">{formatPl(p.startDate)} – {formatPl(p.endDate)} · {days} dni</div>
                </div>
                {hard > 0 && <span className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{hard} naruszeń</span>}
              </div>
              <div className="row">
                <button
                  className={isExpanded ? '' : 'ghost'}
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  {isExpanded ? '▲ Schowaj' : '📅 Kalendarz'}
                </button>
                <button
                  className="ghost"
                  disabled={regenId !== null}
                  onClick={() => handleRegen(p)}
                >
                  ↺ Regeneruj
                </button>
                <button className="small ghost" onClick={() => { duplicatePlan(p.id); }}>Duplikuj</button>
                <button
                  className="small danger"
                  onClick={() => { if (confirm('Usunąć plan?')) deletePlan(p.id); }}
                >
                  Usuń
                </button>
              </div>

              {isExpanded && (
                <div className="stack">
                  <PlanSummary plan={p} dishMap={dishMap} />
                  <Calendar plan={p} />
                  <ViolationsPanel plan={p} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {regenId && (
        <GenerateDialog progress={progress} onAbort={handleAbort} />
      )}
    </div>
  );
}
