import { useTranslation } from 'react-i18next';
import type { Plan } from '../types/plan';

interface Props {
  plan: Plan;
}

export function ViolationsPanel({ plan }: Props) {
  const { t } = useTranslation();
  const hard = plan.violations.filter((v) => v.severity === 'hard');
  const soft = plan.violations.filter((v) => v.severity === 'soft');
  const info = plan.violations.filter((v) => v.severity === 'info');

  return (
    <div className="violations-panel">
      <h2>{t('violations.title')}</h2>
      {plan.violations.length === 0 && (
        <div className="muted">{t('violations.none')}</div>
      )}
      {hard.length > 0 && (
        <>
          <h3 style={{ fontSize: '1rem', marginTop: 8 }}>{t('violations.hard')}</h3>
          {hard.map((v, i) => (
            <div key={`h-${i}`} className="violation-item hard">{v.message}</div>
          ))}
        </>
      )}
      {soft.length > 0 && (
        <>
          <h3 style={{ fontSize: '1rem', marginTop: 10 }}>{t('violations.soft')}</h3>
          {soft.map((v, i) => (
            <div key={`s-${i}`} className="violation-item soft">{v.message}</div>
          ))}
        </>
      )}
      {info.length > 0 && (
        <>
          <h3 style={{ fontSize: '1rem', marginTop: 10 }}>{t('violations.info')}</h3>
          {info.map((v, i) => (
            <div key={`i-${i}`} className="violation-item info">{v.message}</div>
          ))}
        </>
      )}
    </div>
  );
}
