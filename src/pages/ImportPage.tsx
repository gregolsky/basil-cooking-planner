import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { decodeLink } from '../lib/storage/exportImport';

export function ImportPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const replaceAll = useAppStore((s) => s.replaceAll);

  const [state, setState] = useState<'waiting' | 'loading' | 'error'>('waiting');
  const [preview, setPreview] = useState<{ dishes: number; plans: number; tags: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = params.get('d');
    if (!encoded) {
      setError('Brak danych do zaimportowania w linku.');
      setState('error');
      return;
    }
    try {
      const data = decodeLink(encoded);
      setPreview({
        dishes: data.dishes.length,
        plans: data.plans.length,
        tags: data.tagDefinitions?.length ?? 0,
      });
    } catch (e) {
      setError(`Nie udało się odczytać linku: ${String(e)}`);
      setState('error');
    }
  }, [params]);

  const confirmImport = () => {
    const encoded = params.get('d');
    if (!encoded) return;
    setState('loading');
    try {
      const data = decodeLink(encoded);
      replaceAll({
        dishes: data.dishes,
        dayModifiers: data.dayModifiers,
        plans: data.plans,
        activePlanId: data.activePlanId,
        tagDefinitions: data.tagDefinitions ?? [],
      });
      navigate('/', { replace: true });
    } catch (e) {
      setError(`Import nieudany: ${String(e)}`);
      setState('error');
    }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>📥 Import danych z linku</h1></div>
      {state === 'error' && (
        <div className="card" style={{ background: '#faeaea' }}>{error}</div>
      )}
      {preview && state === 'waiting' && (
        <div className="card stack">
          <div>
            W linku znaleziono: <strong>{preview.dishes}</strong> dań,
            {' '}<strong>{preview.plans}</strong> planów,
            {' '}<strong>{preview.tags}</strong> etykiet.
          </div>
          <div className="muted">Import nadpisze wszystkie dane lokalne.</div>
          <div className="row">
            <button onClick={() => navigate('/')} className="ghost">Anuluj</button>
            <div className="spacer" />
            <button onClick={confirmImport}>Nadpisz dane lokalne</button>
          </div>
        </div>
      )}
      {state === 'loading' && <div className="card">Importuję…</div>}
    </div>
  );
}
