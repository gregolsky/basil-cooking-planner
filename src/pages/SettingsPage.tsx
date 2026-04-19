import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
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
  const appState = useAppStore((s) => ({
    dishes: s.dishes,
    dayModifiers: s.dayModifiers,
    plans: s.plans,
    activePlanId: s.activePlanId,
    tagDefinitions: s.tagDefinitions,
  }));
  const familyName = useAppStore((s) => s.familyName);
  const setFamilyName = useAppStore((s) => s.setFamilyName);
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
    setMessage(copied ? 'Link skopiowany do schowka.' : url);
  };

  const doImport = async (file: File) => {
    setError(null);
    try {
      const data = await parseJson(file);
      if (!confirm('Import nadpisze wszystkie dane lokalne. Kontynuować?')) return;
      replaceAll({
        dishes: data.dishes,
        dayModifiers: data.dayModifiers,
        plans: data.plans,
        activePlanId: data.activePlanId,
        tagDefinitions: data.tagDefinitions ?? [],
      });
      setMessage(`Zaimportowano: ${data.dishes.length} dań, ${data.plans.length} planów.`);
    } catch (e) {
      setError(`Nie udało się zaimportować: ${String(e)}`);
    }
  };

  const doReset = () => {
    if (confirm('Usunąć wszystkie dane lokalne? Tej operacji nie można cofnąć.')) {
      reset();
      setMessage('Dane wyczyszczone.');
    }
  };

  return (
    <div className="page stack" style={{ gap: 20 }}>
      <div className="page-header"><h1>⚙️ Dane i udostępnianie</h1></div>

      <div className="card stack">
        <h2>🌿 Rodzina</h2>
        <label>
          Nazwa rodziny
          <div className="row">
            <input
              type="text"
              className="grow"
              value={familyNameDraft}
              onChange={(e) => setFamilyNameDraft(e.target.value)}
              placeholder="np. Kowalskich"
            />
            <button
              className="ghost"
              disabled={!familyNameDraft.trim() || familyNameDraft.trim() === familyName}
              onClick={() => { setFamilyName(familyNameDraft); setMessage('Nazwa rodziny zapisana.'); }}
            >
              Zapisz
            </button>
          </div>
        </label>
      </div>

      <TagManager />

      <div className="card stack">
        <h2>Eksport</h2>
        <div className="muted">Zapisz kopię wszystkich danych (biblioteka dań, etykiety, modyfikatory dni, plany).</div>
        <div className="row">
          <button onClick={doExport}>Pobierz JSON</button>
          <button onClick={doShareLink} className="ghost">Skopiuj link z danymi</button>
        </div>
      </div>

      <div className="card stack">
        <h2>Import</h2>
        <div className="muted">Wczytaj dane z pliku JSON. Istniejące dane zostaną nadpisane.</div>
        <div className="row">
          <button onClick={() => fileInput.current?.click()}>Wybierz plik JSON…</button>
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
        <h2>Reset</h2>
        <div className="row">
          <button onClick={doReset} className="danger">Usuń wszystkie dane lokalne</button>
        </div>
      </div>

      {message && <div className="card" style={{ background: '#d4e6cc' }}>{message}</div>}
      {error && <div className="card" style={{ background: '#faeaea' }}>{error}</div>}
    </div>
  );
}
