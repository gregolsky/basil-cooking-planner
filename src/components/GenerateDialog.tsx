import type { GAProgress } from '../lib/ga/types';

interface Props {
  progress: GAProgress;
  onAbort: () => void;
}

export function GenerateDialog({ progress, onAbort }: Props) {
  const pct = progress.totalGenerations > 0
    ? Math.round((progress.generation / progress.totalGenerations) * 100)
    : 0;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Gotuję idealny plan…</h2>
        <p className="muted">
          Generacja {progress.generation} / {progress.totalGenerations || '?'}
          {Number.isFinite(progress.bestFitness) && progress.generation > 0 && (
            <> · najlepszy fitness: <strong>{Math.round(progress.bestFitness)}</strong></>
          )}
        </p>
        <div className="progress-bar"><span style={{ width: `${pct}%` }} /></div>
        <div className="row" style={{ marginTop: 16 }}>
          <div className="spacer" />
          <button className="ghost" onClick={onAbort}>Przerwij</button>
        </div>
      </div>
    </div>
  );
}
