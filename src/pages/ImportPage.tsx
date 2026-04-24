import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { decodeLink } from '../lib/storage/exportImport';

export function ImportPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const replaceAll = useAppStore((s) => s.replaceAll);

  const [state, setState] = useState<'waiting' | 'loading' | 'error'>('waiting');
  const [preview, setPreview] = useState<{ dishes: number; plans: number; tags: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = params.get('d');
    if (!encoded) {
      setError(t('import.noData'));
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
      setError(t('import.decodeError', { error: String(e) }));
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
      setError(t('import.importFailed', { error: String(e) }));
      setState('error');
    }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>{t('import.title')}</h1></div>
      {state === 'error' && (
        <div className="card" style={{ background: '#faeaea' }}>{error}</div>
      )}
      {preview && state === 'waiting' && (
        <div className="card stack">
          <div>
            {t('import.found', { dishes: preview.dishes, plans: preview.plans, tags: preview.tags })}
          </div>
          <div className="muted">{t('import.overwriteWarning')}</div>
          <div className="row">
            <button onClick={() => navigate('/')} className="ghost">{t('common.cancel')}</button>
            <div className="spacer" />
            <button onClick={confirmImport}>{t('import.confirmButton')}</button>
          </div>
        </div>
      )}
      {state === 'loading' && <div className="card">{t('import.loading')}</div>}
    </div>
  );
}
