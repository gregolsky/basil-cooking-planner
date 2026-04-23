import type { Plan } from '../types/plan';
import type { Dish } from '../types/dish';
import { formatPl } from '../lib/utils/date';
import { ExportDialog } from './ExportDialog';
import { useState } from 'react';

interface Props {
  plan: Plan;
  dishMap: Map<string, Dish>;
}

export function PlanSummary({ plan, dishMap }: Props) {
  const [exportOpen, setExportOpen] = useState(false);
  const uniqueDishes = new Set(
    plan.meals.filter((m) => !m.isLeftover && m.dishId).map((m) => m.dishId!),
  );
  const meats = new Set(
    Array.from(uniqueDishes)
      .map((id) => dishMap.get(id)?.meat)
      .filter(Boolean),
  );

  return (
    <div className="card no-print" style={{ marginBottom: 20 }}>
      <div className="row">
        <div className="grow">
          <div className="muted">
            {formatPl(plan.startDate)} – {formatPl(plan.endDate)} · {plan.meals.length} dni
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className="badge soft">{uniqueDishes.size} różnych dań</span>
            <span className="badge soft">{meats.size} rodzajów mięsa</span>
            <span className="badge">fitness {Math.round(plan.fitness)}</span>
          </div>
        </div>
        <button className="no-print" onClick={() => setExportOpen(true)}>Eksport / udostępnij</button>
      </div>
      {exportOpen && (
        <ExportDialog plan={plan} dishMap={dishMap} onClose={() => setExportOpen(false)} />
      )}
    </div>
  );
}
