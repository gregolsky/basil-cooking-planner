import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { formatPl, daysBetween } from '../lib/utils/date';
import type { Plan } from '../types/plan';

function overlapsWith(plan: Plan, others: Plan[]): Plan[] {
  return others.filter((o) => {
    if (o.id === plan.id) return false;
    return !(o.endDate < plan.startDate || o.startDate > plan.endDate);
  });
}

export function PlansListPage() {
  const plans = useAppStore((s) => s.plans);
  const activePlanId = useAppStore((s) => s.activePlanId);
  const setActivePlan = useAppStore((s) => s.setActivePlan);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const duplicatePlan = useAppStore((s) => s.duplicatePlan);
  const navigate = useNavigate();

  const sorted = [...plans].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

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
          const overlaps = overlapsWith(p, plans);
          const isActive = p.id === activePlanId;
          const days = daysBetween(p.startDate, p.endDate) + 1;
          const hard = p.violations.filter((v) => v.severity === 'hard').length;
          return (
            <div
              key={p.id}
              className="card stack"
              style={isActive ? { borderLeft: '6px solid var(--color-red)' } : undefined}
            >
              <div className="row">
                <div className="grow">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-red-dark)' }}>
                    {p.name ?? `Plan ${formatPl(p.startDate)}`}
                  </div>
                  <div className="muted">{formatPl(p.startDate)} – {formatPl(p.endDate)} · {days} dni</div>
                </div>
                {isActive && <span className="badge">aktywny</span>}
                {hard > 0 && <span className="badge" style={{ background: '#faeaea', color: 'var(--color-red-dark)' }}>{hard} twardych naruszeń</span>}
                {overlaps.length > 0 && (
                  <span className="badge soft">nakłada się ({overlaps.length})</span>
                )}
              </div>
              <div className="row">
                {!isActive && (
                  <button className="small" onClick={() => { setActivePlan(p.id); navigate('/'); }}>
                    Ustaw aktywny
                  </button>
                )}
                <button className="small ghost" onClick={() => { duplicatePlan(p.id); }}>Duplikuj</button>
                <button
                  className="small danger"
                  onClick={() => { if (confirm('Usunąć plan?')) deletePlan(p.id); }}
                >
                  Usuń
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
