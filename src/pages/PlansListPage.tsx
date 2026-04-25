import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { formatDateLocale, daysBetween, toISODate } from '../lib/utils/date';
import { Calendar } from '../components/Calendar';
import { ViolationsPanel } from '../components/ViolationsPanel';
import { PlanSummary } from '../components/PlanSummary';
import { GenerateDialog } from '../components/GenerateDialog';
import { buildDayContexts } from '../lib/days/capacity';
import { listDates } from '../lib/utils/date';
import { runGAInWorker } from '../lib/ga/runner';
import type { Plan, PlannedMeal } from '../types/plan';

export function PlansListPage() {
  const { t, i18n } = useTranslation();
  const plans = useAppStore((s) => s.plans);
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const cumulativeLimits = useAppStore((s) => s.cumulativeLimits);
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

    const today = toISODate(new Date());
    const locked = plan.meals.filter((m) => m.locked || m.date < today);
    const dates = listDates(plan.startDate, plan.endDate);
    const days = buildDayContexts(dates, dayModifiers);

    const { promise, abort } = runGAInWorker({
      dishes,
      days,
      lockedMeals: locked,
      cumulativeLimits,
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
        <h1>{t('plans.title')}</h1>
        <Link to="/new-plan"><button>{t('plans.newPlan')}</button></Link>
      </div>

      {sorted.length === 0 && (
        <div className="card empty-state">
          {t('plans.empty')} <Link to="/new-plan">{t('plans.emptyAction')}</Link>.
        </div>
      )}

      <div className="stack">
        {sorted.map((p) => {
          const isExpanded = p.id === expandedId;
          const days = daysBetween(p.startDate, p.endDate) + 1;
          const hard = p.violations.filter((v) => v.severity === 'hard').length;
          const today = toISODate(new Date());
          const allInPast = p.endDate < today;

          return (
            <div key={p.id} className={`card stack${isExpanded ? '' : ' no-print'}`}>
              <div className="row no-print">
                <div className="grow">
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-red-dark)' }}>
                    {p.name ?? t('plans.planFallbackName', { date: formatDateLocale(p.startDate, i18n.language) })}
                  </div>
                  <div className="muted">{formatDateLocale(p.startDate, i18n.language)} – {formatDateLocale(p.endDate, i18n.language)} · {t('plans.days', { count: days })}</div>
                </div>
                {hard > 0 && <span className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{t('plans.violations', { count: hard })}</span>}
              </div>
              <div className="row no-print">
                <button
                  className={isExpanded ? '' : 'ghost'}
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  {isExpanded ? t('plans.hideCalendar') : t('plans.showCalendar')}
                </button>
                {!allInPast && (
                  <button
                    className="ghost"
                    disabled={regenId !== null}
                    onClick={() => handleRegen(p)}
                  >
                    {t('plans.regenerate')}
                  </button>
                )}
                <Link to={`/extend-plan/${p.id}`}>
                  <button className="small ghost" disabled={regenId !== null}>{t('plans.extend')}</button>
                </Link>
                <button className="small ghost" onClick={() => { duplicatePlan(p.id); }}>{t('plans.duplicate')}</button>
                <button
                  className="small danger"
                  onClick={() => { if (confirm(t('plans.confirmDelete'))) deletePlan(p.id); }}
                >
                  {t('plans.delete')}
                </button>
              </div>

              {isExpanded && (
                <div className="stack">
                  <div className="print-header">
                    <div className="print-title">{p.name ?? t('plans.planFallbackName', { date: formatDateLocale(p.startDate, i18n.language) })}</div>
                    <div className="print-dates">{formatDateLocale(p.startDate, i18n.language)} – {formatDateLocale(p.endDate, i18n.language)}</div>
                  </div>
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
