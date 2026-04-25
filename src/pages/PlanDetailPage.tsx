import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { formatDateLocale, daysBetween, toISODate } from '../lib/utils/date';
import { getLockedMealsForRegen, isPlanFullyInPast } from '../lib/plan/regen';
import { Calendar } from '../components/Calendar';
import { ViolationsPanel } from '../components/ViolationsPanel';
import { PlanSummary } from '../components/PlanSummary';
import { GenerateDialog } from '../components/GenerateDialog';
import { buildDayContexts } from '../lib/days/capacity';
import { listDates } from '../lib/utils/date';
import { runGAInWorker } from '../lib/ga/runner';
import type { PlannedMeal } from '../types/plan';

export function PlanDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const plan = useAppStore((s) => s.plans.find((p) => p.id === id) ?? null);
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const cumulativeLimits = useAppStore((s) => s.cumulativeLimits);
  const tagDefinitions = useAppStore((s) => s.tagDefinitions);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const duplicatePlan = useAppStore((s) => s.duplicatePlan);

  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ generation: 0, bestFitness: 0, totalGenerations: 200 });
  const [abortFn, setAbortFn] = useState<(() => void) | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  if (!plan) {
    return (
      <div className="page">
        <div className="page-header"><h1>{t('plans.title')}</h1></div>
        <div className="card empty-state">
          {t('extend.notFound')} <Link to="/plans">{t('extend.backToPlans')}</Link>.
        </div>
      </div>
    );
  }

  const allInPast = isPlanFullyInPast(plan, toISODate(new Date()));
  const days = daysBetween(plan.startDate, plan.endDate) + 1;
  const hard = plan.violations.filter((v) => v.severity === 'hard').length;

  const handleRegen = () => {
    setRegenId(plan.id);
    setProgress({ generation: 0, bestFitness: 0, totalGenerations: 200 });

    const locked = getLockedMealsForRegen(plan.meals, toISODate(new Date()));
    const dates = listDates(plan.startDate, plan.endDate);
    const dayContexts = buildDayContexts(dates, dayModifiers);

    const { promise, abort } = runGAInWorker({
      dishes,
      days: dayContexts,
      lockedMeals: locked,
      cumulativeLimits,
      tagDefs: tagDefinitions,
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
        {editingName ? (
          <form
            className="row"
            style={{ gap: 8, flexGrow: 1 }}
            onSubmit={(e) => {
              e.preventDefault();
              updatePlan(plan.id, (p) => ({ ...p, name: nameValue.trim() || undefined }));
              setEditingName(false);
            }}
          >
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder={t('plans.planFallbackName', { date: formatDateLocale(plan.startDate, i18n.language) })}
              style={{ flexGrow: 1, fontSize: '1.4rem', fontWeight: 700 }}
            />
            <button type="submit">{t('common.save')}</button>
            <button type="button" className="ghost" onClick={() => setEditingName(false)}>{t('common.cancel')}</button>
          </form>
        ) : (
          <h1 className="row" style={{ gap: 8, alignItems: 'center' }}>
            {plan.name ?? t('plans.planFallbackName', { date: formatDateLocale(plan.startDate, i18n.language) })}
            <button
              className="ghost small no-print"
              style={{ fontSize: '0.9rem', border: 'none', background: 'none', padding: 0 }}
              onClick={() => { setNameValue(plan.name ?? ''); setEditingName(true); }}
              aria-label={t('plans.renamePlan')}
            >✏️</button>
          </h1>
        )}
        {!editingName && <Link to="/plans"><button className="ghost">{t('extend.backToPlans')}</button></Link>}
      </div>

      <div className="card no-print">
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div className="muted" style={{ flexGrow: 1 }}>
            {formatDateLocale(plan.startDate, i18n.language)} – {formatDateLocale(plan.endDate, i18n.language)} · {t('plans.days', { count: days })}
            {hard > 0 && <> · <span className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{t('plans.violations', { count: hard })}</span></>}
          </div>
          {!allInPast && (
            <button className="ghost" disabled={regenId !== null} onClick={handleRegen}>
              {t('plans.regenerate')}
            </button>
          )}
          <Link to={`/extend-plan/${plan.id}`}>
            <button className="small ghost">{t('plans.extend')}</button>
          </Link>
          <button className="small ghost" onClick={() => { window.print(); }}>{t('plans.print')}</button>
          <button className="small ghost" onClick={() => duplicatePlan(plan.id)}>{t('plans.duplicate')}</button>
          <button className="small danger" onClick={() => { if (confirm(t('plans.confirmDelete'))) { deletePlan(plan.id); window.location.hash = '#/plans'; } }}>
            {t('plans.delete')}
          </button>
        </div>
      </div>

      <div className="print-header">
        <div className="print-title">{plan.name ?? t('plans.planFallbackName', { date: formatDateLocale(plan.startDate, i18n.language) })}</div>
        <div className="print-dates">{formatDateLocale(plan.startDate, i18n.language)} – {formatDateLocale(plan.endDate, i18n.language)}</div>
      </div>
      <PlanSummary plan={plan} dishMap={dishMap} />
      <Calendar plan={plan} />
      <ViolationsPanel plan={plan} />

      {regenId && <GenerateDialog progress={progress} onAbort={handleAbort} />}
    </div>
  );
}
