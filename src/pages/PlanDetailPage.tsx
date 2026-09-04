import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, MoreVertical, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateLocale, daysBetween, toISODate } from '../lib/utils/date';
import { getLockedMealsForRegen, isPlanFullyInPast } from '../lib/plan/regen';
import { isPastDate } from '../lib/plan/pastDays';
import { Calendar } from '../components/Calendar';
import { ViolationsPanel } from '../components/ViolationsPanel';
import { PlanSummary } from '../components/PlanSummary';
import { GenerateDialog } from '../components/GenerateDialog';
import { PageHero } from '../components/PageHero';
import { buildDayContexts } from '../lib/days/capacity';
import { listDates } from '../lib/utils/date';
import { runGAInWorker } from '../lib/ga/runner';
import { useDismiss } from '../hooks/useDismiss';
import { planToIcs, icsFileName } from '../lib/ics/exporter';
import { download } from '../lib/share/webShare';
import type { PlannedMeal } from '../types/plan';
import type { MeatType } from '../types/dish';

export function PlanDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const plan = useAppStore((s) => s.plans.find((p) => p.id === id) ?? null);
  const dishes = useAppStore((s) => s.dishes);
  const tagDefinitions = useAppStore((s) => s.tagDefinitions);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const duplicatePlan = useAppStore((s) => s.duplicatePlan);
  const sameMeatPenalty = useAppStore((s) => s.sameMeatPenalty);

  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const tagNameMap = useMemo(() => new Map(tagDefinitions.map((t) => [t.id, t.name])), [tagDefinitions]);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ generation: 0, bestFitness: 0, totalGenerations: 200 });
  const [abortFn, setAbortFn] = useState<(() => void) | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismiss({ onDismiss: closeMenu, active: menuOpen, containerRef: menuRef });

  if (!plan) {
    return (
      <div className="page">
        <div className="page-header"><h1><CalendarIcon size={24} /> {t('plans.title')}</h1></div>
        <div className="card empty-state">
          {t('extend.notFound')} <Link to="/plans">{t('extend.backToPlans')}</Link>.
        </div>
      </div>
    );
  }

  const today = toISODate(new Date());
  const allInPast = isPlanFullyInPast(plan, today);
  const days = daysBetween(plan.startDate, plan.endDate) + 1;
  const hard = plan.violations.filter((v) => v.severity === 'hard').length;
  // Past days are excluded from print (Calendar.tsx), so the printed date range
  // should reflect what actually prints, not the plan's full stored range.
  const printStartDate = !allInPast && isPastDate(plan.startDate, today) ? today : plan.startDate;

  const handleRegen = () => {
    setRegenId(plan.id);
    setProgress({ generation: 0, bestFitness: 0, totalGenerations: 200 });

    const locked = getLockedMealsForRegen(plan.meals, toISODate(new Date()));
    const dates = listDates(plan.startDate, plan.endDate);
    const dayContexts = buildDayContexts(dates, plan.dayModifiers ?? []);

    const { promise, abort } = runGAInWorker({
      dishes,
      days: dayContexts,
      lockedMeals: locked,
      cumulativeLimits: plan.cumulativeLimits ?? [],
      tagDefs: tagDefinitions,
      weights: { sameMeatPenalty },
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
    <>
      <PageHero />
      <div className="page">
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
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
          <div className="grow">
            <h1 className="row" style={{ gap: 8, alignItems: 'center' }}>
              {plan.name ?? t('plans.planFallbackName', { date: formatDateLocale(plan.startDate, i18n.language) })}
              <button
                className="icon-btn no-print"
                onClick={() => { setNameValue(plan.name ?? ''); setEditingName(true); }}
                aria-label={t('plans.renamePlan')}
              ><Pencil size={16} /></button>
            </h1>
            <div className="row plan-meta no-print">
              <span>{formatDateLocale(plan.startDate, i18n.language)} – {formatDateLocale(plan.endDate, i18n.language)} · {t('plans.days', { count: days })}</span>
              <PlanSummary plan={plan} dishMap={dishMap} />
              {hard > 0 && <span className="badge">{t('plans.violations', { count: hard })}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="row no-print" style={{ marginBottom: 20 }}>
        <Link to="/plans"><button className="ghost small">{t('common.back')}</button></Link>
        <div className="spacer" />
        {!allInPast && (
          <button className="small" disabled={regenId !== null} onClick={handleRegen}>
            {t('plans.regenerate')}
          </button>
        )}
        <button className="small ghost" onClick={() => { window.print(); }}>{t('plans.print')}</button>
        <div className="menu-dropdown" ref={menuRef}>
          <button
            type="button"
            className="small ghost"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label={t('plans.moreActions')}
            onClick={() => setMenuOpen((v) => !v)}
          ><MoreVertical size={16} /></button>
          {menuOpen && (
            <div className="menu-dropdown-panel">
              <button
                className="small ghost"
                onClick={() => {
                  const ics = planToIcs(plan, dishMap, {
                    calendarName: plan.name ?? t('plans.planFallbackName', { date: formatDateLocale(plan.startDate, i18n.language) }),
                    difficulty: t('ics.difficulty'),
                    tags: t('ics.tags'),
                    meatLabel: (m: MeatType) => t(`meat.${m}`),
                    tagName: (id: string) => tagNameMap.get(id) ?? id,
                  });
                  download(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), icsFileName(plan));
                  setMenuOpen(false);
                }}
              >
                {t('plans.exportIcs')}
              </button>
              <Link to={`/extend-plan/${plan.id}`} onClick={() => setMenuOpen(false)}>
                <button className="small ghost">{t('plans.extend')}</button>
              </Link>
              <button className="small ghost" onClick={() => { duplicatePlan(plan.id); setMenuOpen(false); }}>{t('plans.duplicate')}</button>
              <button
                className="small danger"
                onClick={() => {
                  if (confirm(t('plans.confirmDelete'))) { deletePlan(plan.id); window.location.hash = '#/plans'; }
                  setMenuOpen(false);
                }}
              >
                {t('plans.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="print-header">
        <img src="/basil-cooking-planner/basil-logo-transparent.png" alt="Basil" className="print-logo" />
        <div className="print-title">{plan.name ?? t('plans.planFallbackName', { date: formatDateLocale(plan.startDate, i18n.language) })}</div>
        <div className="print-dates">{formatDateLocale(printStartDate, i18n.language)} – {formatDateLocale(plan.endDate, i18n.language)}</div>
      </div>
      <div className="calendar-surface">
        <Calendar plan={plan} />
      </div>
      <ViolationsPanel plan={plan} />

      {regenId && <GenerateDialog progress={progress} onAbort={handleAbort} />}
      </div>
    </>
  );
}
