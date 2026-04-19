import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parseDishCsv, DISH_CSV_SAMPLE } from '../lib/csv/dishImport';
import type { Dish } from '../types/dish';

export function DishCsvImport() {
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const upsertDish = useAppStore((s) => s.upsertDish);
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<Dish[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const tagNameToId = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tagDefs) m.set(t.name.toLowerCase(), t.id);
    return m;
  }, [tagDefs]);

  const handleFile = async (file: File) => {
    setStatus(null);
    const text = await file.text();
    const { dishes, warnings } = parseDishCsv(text, tagNameToId);
    setPreview(dishes);
    setWarnings(warnings);
  };

  const confirmImport = () => {
    if (!preview) return;
    for (const d of preview) upsertDish(d);
    setStatus(`Zaimportowano ${preview.length} dań.`);
    setPreview(null);
    setWarnings([]);
  };

  const cancel = () => { setPreview(null); setWarnings([]); };

  const copySample = async () => {
    try {
      await navigator.clipboard.writeText(DISH_CSV_SAMPLE);
      setStatus('Przykład skopiowany do schowka.');
    } catch {
      setStatus(DISH_CSV_SAMPLE);
    }
  };

  return (
    <div className="card stack">
      <h2>📂 Import dań z CSV</h2>
      <div className="muted">
        Wczytaj plik CSV z biblioteką dań. Istniejące dania pozostają — nowe są dopisywane.
      </div>

      <div className="row">
        <button onClick={() => fileRef.current?.click()}>Wybierz plik CSV…</button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        <button className="ghost" onClick={copySample}>Kopiuj przykład</button>
      </div>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-blue-dark)' }}>
          📝 Format pliku (kliknij, aby rozwinąć)
        </summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="muted">
            Pierwsza linia to nagłówek. Separator: <code>;</code>, <code>,</code> lub tabulator (wykrywany automatycznie).
            Akceptowane nazwy kolumn (polskie lub angielskie):
          </div>
          <table className="menu-table">
            <thead>
              <tr><th>Kolumna</th><th>Alias</th><th>Wartości</th></tr>
            </thead>
            <tbody>
              <tr><td><code>name</code></td><td>nazwa</td><td>tekst (wymagane)</td></tr>
              <tr><td><code>meat</code></td><td>mięso</td><td>wołowina / wieprzowina / drób / ryba / bezmięsne</td></tr>
              <tr><td><code>difficulty</code></td><td>trudność</td><td>1–5</td></tr>
              <tr><td><code>prepTimeMin</code></td><td>czas / minuty</td><td>liczba minut</td></tr>
              <tr><td><code>preference</code></td><td>preferencja</td><td>1–5 (jak bardzo lubi rodzina)</td></tr>
              <tr><td><code>servesDays</code></td><td>starcza</td><td>1–3 (ile dni zje rodzina)</td></tr>
              <tr><td><code>tags</code></td><td>etykiety</td><td>nazwy rozdzielone <code>|</code> lub <code>,</code></td></tr>
              <tr><td><code>notes</code></td><td>notatki</td><td>tekst</td></tr>
            </tbody>
          </table>
          <div className="muted">Przykład:</div>
          <pre className="format-sample">{DISH_CSV_SAMPLE}</pre>
        </div>
      </details>

      {preview && (
        <div className="card stack" style={{ background: 'var(--color-blue-soft)' }}>
          <div>
            <strong>Podgląd:</strong> znaleziono <strong>{preview.length}</strong> dań.
          </div>
          {warnings.length > 0 && (
            <details open>
              <summary style={{ cursor: 'pointer', color: 'var(--color-red-dark)' }}>
                ⚠️ {warnings.length} ostrzeżeń
              </summary>
              <ul style={{ margin: '8px 0 0 0', fontSize: 13 }}>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}
          <ul style={{ fontSize: 14, margin: 0, maxHeight: 180, overflowY: 'auto' }}>
            {preview.slice(0, 20).map((d) => (
              <li key={d.id}>
                <strong>{d.name}</strong> — {d.meat} · trud. {d.difficulty} · pref. {d.preference}
                {d.tags.length > 0 && ` · [${d.tags.length} etykiet]`}
              </li>
            ))}
            {preview.length > 20 && <li className="muted">…i {preview.length - 20} więcej</li>}
          </ul>
          <div className="row">
            <button className="ghost" onClick={cancel}>Anuluj</button>
            <div className="spacer" />
            <button onClick={confirmImport}>Dopisz do biblioteki</button>
          </div>
        </div>
      )}

      {status && !preview && (
        <div className="muted" style={{ color: 'var(--color-green)' }}>{status}</div>
      )}
    </div>
  );
}
