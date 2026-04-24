import { useTranslation } from 'react-i18next';
import type { GAProgress } from '../lib/ga/types';

interface Props {
  progress: GAProgress;
  onAbort: () => void;
}

export function GenerateDialog({ progress, onAbort }: Props) {
  const { t } = useTranslation();
  const pct = progress.totalGenerations > 0
    ? Math.round((progress.generation / progress.totalGenerations) * 100)
    : 0;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{t('generateDialog.title')}</h2>
        <p className="muted">
          {t('generateDialog.progress', { gen: progress.generation, total: progress.totalGenerations || '?' })}
          {Number.isFinite(progress.bestFitness) && progress.generation > 0 && (
            <> · {t('generateDialog.bestFitness', { score: Math.round(progress.bestFitness) })}</>
          )}
        </p>
        <div className="progress-bar"><span style={{ width: `${pct}%` }} /></div>
        <div className="row" style={{ marginTop: 16 }}>
          <div className="spacer" />
          <button className="ghost" onClick={onAbort}>{t('generateDialog.abort')}</button>
        </div>
      </div>
    </div>
  );
}
