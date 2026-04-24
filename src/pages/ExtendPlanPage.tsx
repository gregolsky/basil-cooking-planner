import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import {
  toISODate,
  addDays,
  daysBetween,
  listDates,
  formatDateLocale,
  formatShortDateLocale,
  weekdayShortLocale,
} from '../lib/utils/date';
import { buildDayContexts } from '../lib/days/capacity';
import { uid } from '../lib/utils/id';
import { GenerateDialog } from '../components/GenerateDialog';
import { DateSelect } from '../components/DateSelect';
import type { Plan, PlannedMeal } from '../types/plan';
import type { CumulativeLimit } from '../types/day';
import { runGAInWorker } from '../lib/ga/runner';

export function ExtendPlanPage() {
  const { t, i18n } = useTranslation();
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
        <div className="page-header"><h1>{t('extend.title')}</h1></div>
        <div className="card empty-state">
          {t('extend.notFound')} <Link to="/plans">{t('extend.backToPlans')}</Link>.
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (dishes.length === 0) {
      setError(t('generator.errorNoDishes'));
      return;
    }
    if (newDays <= 0) {
      setError(t('extend.invalidRange'));
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
      const defaultName = `${sourcePlan.name ?? 'Plan'} ${t('extend.continuationSuffix')}`;
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
      <div className="page-header"><h1>{t('extend.title')}</h1></div>
      <div className="card stack">
        <div className="muted">
          {t('extend.source')}: <strong>{sourcePlan.name ?? t('plans.planFallbackName', { date: formatDateLocale(sourcePlan.startDate, i18n.language) })}</strong>
          {' '}· {formatDateLocale(sourcePlan.startDate, i18n.language)} – {formatDateLocale(sourcePlan.endDate, i18n.language)}
          {' '}· {planLength} {t('plans.days', { count: planLength })}
        </div>

        <label>
          {t('extend.carryDays')}
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
            {t(carryDays === 1 ? 'extend.carryHint_one' : 'extend.carryHint_other', { count: carryDays })}
          </span>
        </label>

        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <label>
            {t('extend.derivedStart')}
            <div className="muted" style={{ padding: '6px 0', fontWeight: 600 }}>
              {start ? `${weekdayShortLocale(start, i18n.language)} ${formatShortDateLocale(start, i18n.language)}` : '—'}
            </div>
          </label>
          <label>
            {t('generator.endDate')}
            <div className="row" style={{ gap: 6, alignItems: 'center' }}>
              <DateSelect value={end} onChange={setEnd} />
              <span className="muted" style={{ fontSize: 13 }}>{end ? weekdayShortLocale(end, i18n.language) : ''}</span>
            </div>
          </label>
        </div>

        <div className="muted">
          {rangeDays > 0
            ? t('extend.rangeInfo', { total: rangeDays, carry: carryDays, new: newDays > 0 ? newDays : 0 })
            : t('generator.rangeInvalid')}
        </div>

        <label>
          {t('generator.planName')}
          <input
            type="text"
            value={name}
            placeholder={`${sourcePlan.name ?? 'Plan'} ${t('extend.continuationSuffix')}`}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {rangeDays > 0 && (
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t('generator.difficultyLimits')}</summary>
            <div style={{ marginTop: 10, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #c7b79d' }}>{t('generator.colDay')}</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px', borderBottom: '1px solid #c7b79d' }}>{t('generator.colCap')}</th>
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
                        <td style={{ padding: '4px 8px' }}>{weekdayShortLocale(date, i18n.language)} {formatShortDateLocale(date, i18n.language)}</td>
                        <td style={{ textAlign: 'center', padding: '4px 8px' }}>
                          <select
                            value={cap ?? ''}
                            style={{ fontSize: 13 }}
                            onChange={(e) => save(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">{t('generator.capAuto')}</option>
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
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t('generator.cumulativeLimits')}</summary>
            <div style={{ marginTop: 10 }} className="stack">
              {cumulativeLimits.length === 0 && (
                <div className="muted" style={{ fontSize: 13 }}>{t('generator.noLimits')}</div>
              )}
              {cumulativeLimits.map((lim) => (
                <div key={lim.id} className="row" style={{ fontSize: 13, alignItems: 'center' }}>
                  <span style={{ flexGrow: 1 }}>
                    {formatShortDateLocale(lim.startDate, i18n.language)} – {formatShortDateLocale(lim.endDate, i18n.language)}: maks. suma <strong>{lim.maxTotal}</strong>
                  </span>
                  <button className="small danger" onClick={() => deleteCumulativeLimit(lim.id)}>{t('common.delete')}</button>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #c7b79d', paddingTop: 8 }} className="stack">
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t('generator.addNewLimit')}</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                  <label style={{ fontSize: 13 }}>
                    {t('generator.from')}
                    <DateSelect value={newLimitStart || start} onChange={setNewLimitStart} />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    {t('generator.to')}
                    <DateSelect value={newLimitEnd || end} onChange={setNewLimitEnd} />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    {t('generator.maxDiffSum')}
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
                    {t('generator.addLimit')}
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
            {t('generator.generate')}
          </button>
        </div>
      </div>

      {dialogOpen && <GenerateDialog progress={progress} onAbort={handleAbort} />}
    </div>
  );
}
