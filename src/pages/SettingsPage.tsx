import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { TagManager } from '../components/TagManager';
import {
  buildAppData,
  exportJson,
  parseJson,
  encodeLink,
  makeShareUrl,
} from '../lib/storage/exportImport';
import { download, copyToClipboard } from '../lib/share/webShare';

export function SettingsPage() {
  const { t } = useTranslation();
  const appState = useAppStore(useShallow((s) => ({
    familyName: s.familyName,
    weekStartDay: s.weekStartDay,
    dishes: s.dishes,
    plans: s.plans,
    activePlanId: s.activePlanId,
    tagDefinitions: s.tagDefinitions,
  })));
  const familyName = useAppStore((s) => s.familyName);
  const setFamilyName = useAppStore((s) => s.setFamilyName);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const weekStartDay = useAppStore((s) => s.weekStartDay);
  const setWeekStartDay = useAppStore((s) => s.setWeekStartDay);
  const replaceAll = useAppStore((s) => s.replaceAll);
  const reset = useAppStore((s) => s.reset);

  const fileInput = useRef<HTMLInputElement>(null);
  const [familyNameDraft, setFamilyNameDraft] = useState(familyName ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doExport = () => {
    const data = buildAppData(appState);
    const stem = `family-cooking-planner-${new Date().toISOString().slice(0, 10)}`;
    download(exportJson(data), `${stem}.json`);
  };

  const doShareLink = async () => {
    const data = buildAppData(appState);
    const encoded = encodeLink(data);
    const url = makeShareUrl(encoded);
    const copied = await copyToClipboard(url);
    setMessage(copied ? t('settings.linkCopied') : url);
  };

  const doImport = async (file: File) => {
    setError(null);
    try {
      const data = await parseJson(file);
      if (!confirm(t('settings.confirmImport'))) return;
      replaceAll({
        familyName: data.familyName,
        weekStartDay: data.weekStartDay,
        dishes: data.dishes,
        plans: data.plans,
        activePlanId: data.activePlanId,
        tagDefinitions: data.tagDefinitions ?? [],
      });
      setMessage(t('settings.importSuccess', { dishes: data.dishes.length, plans: data.plans.length }));
    } catch (e) {
      setError(t('settings.importError', { error: String(e) }));
    }
  };

  const doReset = () => {
    if (confirm(t('settings.confirmReset'))) {
      reset();
      setMessage(t('settings.resetDone'));
    }
  };

  return (
    <div className="page stack" style={{ gap: 20 }}>
      <div className="page-header"><h1>{t('settings.title')}</h1></div>

      <div className="card stack">
        <h2>{t('settings.familySection')}</h2>
        <label>
          {t('settings.familyName')}
          <div className="row">
            <input
              type="text"
              className="grow"
              value={familyNameDraft}
              onChange={(e) => setFamilyNameDraft(e.target.value)}
              placeholder={t('settings.familyNamePlaceholder')}
            />
            <button
              className="ghost"
              disabled={!familyNameDraft.trim() || familyNameDraft.trim() === familyName}
              onClick={() => { setFamilyName(familyNameDraft); setMessage(t('settings.nameSaved')); }}
            >
              {t('settings.saveName')}
            </button>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{t('settings.familyNameHint')}</span>
        </label>
        <label>
          {t('settings.weekStart')}
          <select
            value={weekStartDay}
            onChange={(e) => setWeekStartDay(Number(e.target.value) as 0 | 1)}
            style={{ width: 'fit-content' }}
          >
            <option value={1}>{t('settings.monday')}</option>
            <option value={0}>{t('settings.sunday')}</option>
          </select>
          <span className="muted" style={{ fontSize: 12 }}>{t('settings.weekStartHint')}</span>
        </label>
        <label>
          {t('settings.language')}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'pl' | 'en')}
            style={{ width: 'fit-content' }}
          >
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          {t('settings.theme')}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'trattoria' | 'prl')}
            style={{ width: 'fit-content' }}
          >
            <option value="trattoria">{t('settings.themeTrattoria')}</option>
            <option value="prl">{t('settings.themePrl')}</option>
          </select>
        </label>
      </div>

      <TagManager />

      <div className="card stack">
        <h2>{t('settings.exportSection')}</h2>
        <div className="muted">{t('settings.exportDesc')}</div>
        <div className="row">
          <button onClick={doExport}>{t('settings.downloadJson')}</button>
          <button onClick={doShareLink} className="ghost">{t('settings.copyLink')}</button>
        </div>
      </div>

      <div className="card stack">
        <h2>{t('settings.importSection')}</h2>
        <div className="muted">{t('settings.importDesc')}</div>
        <div className="row">
          <button onClick={() => fileInput.current?.click()}>{t('settings.selectJson')}</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="card stack">
        <h2>{t('settings.resetSection')}</h2>
        <div className="row">
          <button onClick={doReset} className="danger">{t('settings.resetButton')}</button>
        </div>
      </div>

      {message && <div className="card" style={{ background: '#d4e6cc' }}>{message}</div>}
      {error && <div className="card" style={{ background: '#faeaea' }}>{error}</div>}
    </div>
  );
}
