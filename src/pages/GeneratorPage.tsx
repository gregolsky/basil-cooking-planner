import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { toISODate, addDays, daysBetween, listDates, formatShortDateLocale, weekdayShortLocale } from '../lib/utils/date';
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
  const { t, i18n } = useTranslation();
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
      setError(t('generator.errorNoDishes'));
      return;
    }
    if (rangeDays <= 0) {
      setError(t('generator.errorInvalidRange'));
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
      <div className="page-header"><h1>{t('generator.title')}</h1></div>
      <div className="card stack">
        <label>
          {t('generator.planName')}
          <input
            type="text"
            value={name}
            placeholder={t('generator.planNamePlaceholder')}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <label>
            {t('generator.startDate')}
            <div className="row" style={{ gap: 6, alignItems: 'center' }}>
              <DateSelect value={start} onChange={setStart} />
              <span className="muted" style={{ fontSize: 13 }}>{weekdayShortLocale(start, i18n.language)}</span>
            </div>
          </label>
          <label>
            {t('generator.endDate')}
            <div className="row" style={{ gap: 6, alignItems: 'center' }}>
              <DateSelect value={end} onChange={setEnd} />
              <span className="muted" style={{ fontSize: 13 }}>{weekdayShortLocale(end, i18n.language)}</span>
            </div>
          </label>
        </div>
        <div className="muted">
          {rangeDays > 0 ? t('generator.range', { days: rangeDays }) : t('generator.rangeInvalid')}
          {' '}{t('generator.rangeNote')}
        </div>

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
                  <button
                    className="small danger"
                    onClick={() => deleteCumulativeLimit(lim.id)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #c7b79d', paddingTop: 8 }} className="stack">
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t('generator.addNewLimit')}</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                  <label style={{ fontSize: 13 }}>
                    {t('generator.from')}
                    <DateSelect
                      value={newLimitStart || start}
                      onChange={setNewLimitStart}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    {t('generator.to')}
                    <DateSelect
                      value={newLimitEnd || end}
                      onChange={setNewLimitEnd}
                    />
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

        {error && <div className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{error}</div>}

        <div className="row">
          <div className="spacer" />
          <button onClick={handleGenerate} disabled={rangeDays <= 0 || dishes.length === 0}>
            {t('generator.generate')}
          </button>
        </div>
      </div>

      {dialogOpen && (
        <GenerateDialog progress={progress} onAbort={handleAbort} />
      )}
    </div>
  );
}
