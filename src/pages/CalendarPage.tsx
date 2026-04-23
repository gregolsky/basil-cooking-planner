import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Calendar } from '../components/Calendar';
import { ViolationsPanel } from '../components/ViolationsPanel';
import { PlanSummary } from '../components/PlanSummary';
import { Link } from 'react-router-dom';
import { formatPl } from '../lib/utils/date';

export function CalendarPage() {
  const activePlanId = useAppStore((s) => s.activePlanId);
  const plan = useAppStore((s) => s.plans.find((p) => p.id === activePlanId) ?? null);
  const dishes = useAppStore((s) => s.dishes);
  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);

  if (!plan) {
    return (
      <div>
        <div className="hero-banner">
          <div className="hero-overlay">
            <h1 className="hero-title">🌿 Basil</h1>
            <p className="hero-sub">planowanie posiłków dla rodziny</p>
            <Link to="/new-plan">
              <button style={{ fontSize: '1.05rem', padding: '11px 24px' }}>✨ Wygeneruj pierwszy plan</button>
            </Link>
          </div>
        </div>
        <div className="page">
          <div className="card empty-state">
            Brak aktywnego planu. <Link to="/new-plan">Wygeneruj nowy plan</Link> lub wybierz jeden z <Link to="/plans">listy planów</Link>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="print-header">
        <div className="print-title">{plan.name ?? 'Jadłospis'}</div>
        <div className="print-dates">{formatPl(plan.startDate)} – {formatPl(plan.endDate)}</div>
      </div>
      <div className="page-header">
        <h1>🕯️ {plan.name ?? 'Jadłospis'}</h1>
        <Link to="/new-plan">
          <button className="ghost">Nowy plan</button>
        </Link>
      </div>
      <PlanSummary plan={plan} dishMap={dishMap} />
      <Calendar plan={plan} />
      <ViolationsPanel plan={plan} />
    </div>
  );
}
