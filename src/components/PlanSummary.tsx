import type { Plan } from '../types/plan';
import type { Dish } from '../types/dish';
import { useTranslation } from 'react-i18next';
import { computePlanQuality, type PlanQualityTier } from '../lib/plan/quality';

interface Props {
  plan: Plan;
  dishMap: Map<string, Dish>;
}

const QUALITY_LABEL_KEY: Record<PlanQualityTier, string> = {
  perfect: 'summary.qualityPerfect',
  great: 'summary.qualityGreat',
  good: 'summary.qualityGood',
  'could-be-better': 'summary.qualityCouldBeBetter',
};

const QUALITY_BADGE_CLASS: Record<PlanQualityTier, string> = {
  perfect: 'badge gold',
  great: 'badge soft',
  good: 'badge soft',
  'could-be-better': 'badge',
};

/** Badges only — no wrapper. Meant to sit inline alongside a plan's dates in the page header. */
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
  const quality = computePlanQuality({ meals: plan.meals, violations: plan.violations, dishMap });

  return (
    <>
      <span className="badge soft">{t('summary.uniqueDishes', { count: uniqueDishes.size })}</span>
      <span className="badge soft">{t('summary.meatTypes', { count: meats.size })}</span>
      {quality && (
        <span
          className={QUALITY_BADGE_CLASS[quality]}
          title={t('summary.fitness', { score: Math.round(plan.fitness) })}
        >
          {t(QUALITY_LABEL_KEY[quality])}
        </span>
      )}
    </>
  );
}
