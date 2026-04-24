import type { Plan } from '../types/plan';
import type { Dish } from '../types/dish';
import { formatDateLocale } from '../lib/utils/date';
import { ExportDialog } from './ExportDialog';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  plan: Plan;
  dishMap: Map<string, Dish>;
}

export function PlanSummary({ plan, dishMap }: Props) {
  const { t, i18n } = useTranslation();
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
            {formatDateLocale(plan.startDate, i18n.language)} – {formatDateLocale(plan.endDate, i18n.language)} · {plan.meals.length} {t('plans.days', { count: plan.meals.length })}
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className="badge soft">{t('summary.uniqueDishes', { count: uniqueDishes.size })}</span>
            <span className="badge soft">{t('summary.meatTypes', { count: meats.size })}</span>
            <span className="badge">{t('summary.fitness', { score: Math.round(plan.fitness) })}</span>
          </div>
        </div>
        <button className="no-print" onClick={() => setExportOpen(true)}>{t('summary.exportShare')}</button>
      </div>
      {exportOpen && (
        <ExportDialog plan={plan} dishMap={dishMap} onClose={() => setExportOpen(false)} />
      )}
    </div>
  );
}
