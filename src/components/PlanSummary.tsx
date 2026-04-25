import type { Plan } from '../types/plan';
import type { Dish } from '../types/dish';
import { useTranslation } from 'react-i18next';

interface Props {
  plan: Plan;
  dishMap: Map<string, Dish>;
}

export function PlanSummary({ plan, dishMap }: Props) {
  const { t } = useTranslation();
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
      <div className="row" style={{ marginTop: 6 }}>
        <span className="badge soft">{t('summary.uniqueDishes', { count: uniqueDishes.size })}</span>
        <span className="badge soft">{t('summary.meatTypes', { count: meats.size })}</span>
        <span className="badge">{t('summary.fitness', { score: Math.round(plan.fitness) })}</span>
      </div>
    </div>
  );
}
