import { useState } from 'react';
import type { Plan } from '../types/plan';
import type { Dish } from '../types/dish';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { planToCsv } from '../lib/csv/exporter';
import { buildAppData, exportJson, encodeLink, makeShareUrl } from '../lib/storage/exportImport';
import {
  download,
  canShareFiles,
  canShareLink,
  shareFile,
  shareLink,
  copyToClipboard,
} from '../lib/share/webShare';

interface Props {
  plan: Plan;
  dishMap: Map<string, Dish>;
  onClose: () => void;
}

export function ExportDialog({ plan, dishMap, onClose }: Props) {
  const appState = useAppStore(useShallow((s) => ({
    familyName: s.familyName,
    weekStartDay: s.weekStartDay,
    dishes: s.dishes,
    dayModifiers: s.dayModifiers,
    plans: s.plans,
    activePlanId: s.activePlanId,
    tagDefinitions: s.tagDefinitions,
    cumulativeLimits: s.cumulativeLimits,
  })));
  const [busy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const fileStem = `jadlospis-${plan.startDate}-${plan.endDate}`;

  const doCsv = () => {
    const csv = planToCsv(plan, dishMap);
    download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileStem}.csv`);
  };

  const doPrint = () => {
    const prev = document.title;
    document.title = fileStem;
    window.print();
    const restore = () => { document.title = prev; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    onClose();
  };

  const doJson = () => {
    const data = buildAppData(appState);
    download(exportJson(data), `${fileStem}.json`);
  };

  const doShareJson = async () => {
    const data = buildAppData(appState);
    const blob = exportJson(data);
    if (canShareFiles()) {
      const ok = await shareFile(blob, `${fileStem}.json`, 'Jadłospis — Family Cooking Planner');
      if (!ok) download(blob, `${fileStem}.json`);
    } else {
      download(blob, `${fileStem}.json`);
    }
  };

  const doShareLink = async () => {
    const data = buildAppData(appState);
    const encoded = encodeLink(data);
    const url = makeShareUrl(encoded);
    if (canShareLink()) {
      const ok = await shareLink(url, 'Jadłospis', 'Mój jadłospis — otwórz, aby zaimportować');
      if (!ok) {
        const copied = await copyToClipboard(url);
        setStatus(copied ? 'Link skopiowany do schowka.' : 'Nie udało się udostępnić.');
      }
    } else {
      const copied = await copyToClipboard(url);
      setStatus(copied ? 'Link skopiowany do schowka.' : url);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Eksport i udostępnianie</h2>
        <div className="stack">
          <div className="muted">Pobierz plan lub udostępnij go komuś innemu.</div>

          <div className="row">
            <button onClick={doCsv} disabled={busy}>CSV</button>
            <button onClick={doPrint} disabled={busy}>Drukuj / Zapisz PDF</button>
            <button onClick={doJson} disabled={busy}>Pełne dane (JSON)</button>
          </div>

          <hr style={{ width: '100%', border: 'none', borderTop: '1px dashed #c7b79d' }} />

          <div className="row">
            <button onClick={doShareJson} disabled={busy}>
              Udostępnij plik (komunikator)
            </button>
            <button onClick={doShareLink} disabled={busy} className="ghost">
              Udostępnij link
            </button>
          </div>

          {status && <div className="muted">{status}</div>}

          <div className="row">
            <div className="spacer" />
            <button onClick={onClose}>Zamknij</button>
          </div>
        </div>
      </div>
    </div>
  );
}
