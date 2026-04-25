import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { formatDateLocale, daysBetween } from '../lib/utils/date';

export function PlansListPage() {
  const { t, i18n } = useTranslation();
  const plans = useAppStore((s) => s.plans);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const duplicatePlan = useAppStore((s) => s.duplicatePlan);

  const sorted = [...plans].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

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
          const days = daysBetween(p.startDate, p.endDate) + 1;
          const hard = p.violations.filter((v) => v.severity === 'hard').length;

          return (
            <Link key={p.id} to={`/plans/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card no-print" style={{ cursor: 'pointer' }}>
                <div className="row">
                  <div className="grow">
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-red-dark)' }}>
                      {p.name ?? t('plans.planFallbackName', { date: formatDateLocale(p.startDate, i18n.language) })}
                    </div>
                    <div className="muted">{formatDateLocale(p.startDate, i18n.language)} – {formatDateLocale(p.endDate, i18n.language)} · {t('plans.days', { count: days })}</div>
                  </div>
                  <div className="row" style={{ gap: 6 }} onClick={(e) => e.preventDefault()}>
                    {hard > 0 && <span className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{t('plans.violations', { count: hard })}</span>}
                    <Link to={`/extend-plan/${p.id}`}>
                      <button className="small ghost">{t('plans.extend')}</button>
                    </Link>
                    <button className="small ghost" onClick={() => duplicatePlan(p.id)}>{t('plans.duplicate')}</button>
                    <button
                      className="small danger"
                      onClick={() => { if (confirm(t('plans.confirmDelete'))) deletePlan(p.id); }}
                    >
                      {t('plans.delete')}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
