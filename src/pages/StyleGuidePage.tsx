import { useState } from 'react';
import {
  Pin, Pencil, MoreVertical, ChevronRight, Check, X,
  Sparkles, Calendar, CookingPot, Settings,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { DayCard } from '../components/DayCard';
import { ViolationsPanel } from '../components/ViolationsPanel';
import { DifficultyBar } from '../components/DifficultyBar';
import { PlanSummary } from '../components/PlanSummary';
import { MeatIcon } from '../components/MeatIcon';
import { MEAT_LABELS, type Dish } from '../types/dish';
import type { PlannedMeal, Plan } from '../types/plan';
import type { DayContext } from '../lib/days/capacity';
import type { TagDefinition } from '../types/tag';
import { contrastRatio, meetsAA } from '../lib/utils/contrast';

const PALETTE_TABLE: { name: string; hex: string; role: string }[] = [
  { name: '--ground', hex: '#191512', role: 'page ground (table)' },
  { name: '--ground-alt', hex: '#221D18', role: 'nav, sunken surfaces' },
  { name: '--hairline', hex: '#3A332A', role: 'table rules' },
  { name: '--ink', hex: '#F2EEE4', role: 'text on the table' },
  { name: '--ink-soft', hex: '#9B9184', role: 'muted text on the table' },
  { name: '--wine-text', hex: '#E0637A', role: 'wine, legible on dark' },
  { name: '--basil-text', hex: '#6FBF8C', role: 'basil, legible on dark' },
  { name: '--paper', hex: '#EDE7DA', role: 'card / content ground' },
  { name: '--paper-alt', hex: '#E4DCCB', role: 'weekend cards, field bg' },
  { name: '--paper-ink', hex: '#191512', role: 'text on paper' },
  { name: '--paper-ink-soft', hex: '#6E6558', role: 'muted text on paper' },
  { name: '--wine (fill)', hex: '#A5202E', role: 'solid buttons' },
  { name: '--basil (fill)', hex: '#1B5E3F', role: 'solid confirm / locked' },
];

// Token names, not hardcoded hex — resolved live via resolveToken() against
// whichever theme is actually active, so this audit describes the palette
// on screen rather than a Trattoria snapshot that silently stops meaning
// anything once the PRL toggle is flipped.
const CONTRAST_TOKEN_PAIRS: { label: string; fg: string; bg: string }[] = [
  { label: 'ink on ground (body text)', fg: '--ink', bg: '--ground' },
  { label: 'ink-soft on ground (muted text)', fg: '--ink-soft', bg: '--ground' },
  { label: 'wine-text on ground', fg: '--wine-text', bg: '--ground' },
  { label: 'basil-text on ground', fg: '--basil-text', bg: '--ground' },
  { label: 'paper-ink on paper (body text)', fg: '--paper-ink', bg: '--paper' },
  { label: 'paper-ink-soft on paper (muted text)', fg: '--paper-ink-soft', bg: '--paper' },
  { label: 'wine on paper (link/accent text)', fg: '--wine', bg: '--paper' },
  { label: 'basil on paper (link/accent text)', fg: '--basil', bg: '--paper' },
  { label: 'on-fill on wine (button text)', fg: '--on-fill', bg: '--wine' },
  { label: 'on-fill on basil (button text)', fg: '--on-fill', bg: '--basil' },
];

function resolveToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function mockDish(over: Partial<Dish>): Dish {
  return { id: 'x', name: 'Ragù alla bolognese', meat: 'beef', difficulty: 3, preference: 4, tags: [], servesDays: 1, ...over };
}
function mockDay(over: Partial<DayContext>): DayContext {
  return { date: '2026-09-07', difficultyCap: 3, skip: false, requiresTags: [], ...over };
}
function mockMeal(over: Partial<PlannedMeal>): PlannedMeal {
  return { date: '2026-09-07', dishId: 'x', isLeftover: false, locked: false, ...over };
}
const emptyTagMap = new Map<string, TagDefinition>();

const mockPlan: Plan = {
  id: 'sg-plan', createdAt: '2026-09-01', startDate: '2026-09-01', endDate: '2026-09-07',
  fitness: 940,
  meals: [
    mockMeal({ date: '2026-09-01', dishId: 'a' }),
    mockMeal({ date: '2026-09-02', dishId: 'b' }),
  ],
  violations: [
    { date: '2026-09-02', severity: 'hard', kind: 'same-meat', message: 'Wołowina dwa dni z rzędu (wt, śr).' },
    { date: '2026-09-04', severity: 'soft', kind: 'difficulty', message: 'Danie w śr. lekko przekracza limit trudności na dzień powszedni.' },
    { date: '2026-09-06', severity: 'info', kind: 'leftover', message: 'Resztki z piątku starczą na sobotę.' },
  ],
};
const mockDishMap = new Map<string, Dish>([
  ['a', mockDish({ id: 'a', name: 'Schabowy z ziemniakami', meat: 'pork', preference: 5 })],
  ['b', mockDish({ id: 'b', name: 'Pierogi ruskie', meat: 'none', preference: 4 })],
]);

export function StyleGuidePage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [allDarkZone, setAllDarkZone] = useState(false);

  const zoneOverride = allDarkZone
    ? ({
        '--paper': 'var(--ground-alt)',
        '--paper-alt': '#2B241C',
        '--paper-ink': 'var(--ink)',
        '--paper-ink-soft': 'var(--ink-soft)',
        '--paper-hairline': 'var(--hairline)',
      } as React.CSSProperties)
    : undefined;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Style guide</h1>
        <div className="row">
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={allDarkZone} onChange={(e) => setAllDarkZone(e.target.checked)} />
            All-dark paper zone
          </label>
          <button className="ghost small" onClick={() => setTheme(theme === 'prl' ? 'trattoria' : 'prl')}>
            Theme: {theme}
          </button>
        </div>
      </div>

      <div style={zoneOverride}>

      {/* 1 — Palette */}
      <section className="sg-section">
        <h2>1. Palette</h2>
        <p className="muted">Trattoria's fixed hex reference — this table doesn't relabel when you toggle the theme below; everything past this section does.</p>
        <div className="sg-swatches">
          {PALETTE_TABLE.map((c) => (
            <div key={c.name} className="sg-swatch">
              <div className="sg-swatch-color" style={{ background: c.hex }} />
              <div className="sg-swatch-label">
                <div>{c.role}</div>
                <code>{c.name} {c.hex}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2 — Type */}
      <section className="sg-section">
        <h2>2. Type</h2>
        <div className="row" style={{ alignItems: 'stretch' }}>
          <div className="sg-zone-dark sg-zone-half">
            <span className="eyebrow">Cormorant Garamond · table zone · weight 400</span>
            <h1 style={{ fontSize: '3rem', marginTop: 8 }}>Jańdłospis źółta łódź</h1>
            <div className="eyebrow" style={{ marginTop: 16 }}>Inter · tracked caps</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              PONIEDZIAŁEK · ŚRODA · SOŁTYS ŻĆ
            </div>
          </div>
          <div className="sg-zone-paper sg-zone-half">
            <span className="eyebrow">Cormorant Garamond · paper zone · weight 400</span>
            <h2 style={{ fontSize: '2rem', marginTop: 8 }}>Jańdłospis źółta łódź</h2>
            <div className="muted" style={{ marginTop: 16, fontFamily: 'var(--font-ui)' }}>
              Inter body — ąęłńóśźż ĄĘŁŃÓŚŹŻ, the quick brown fox jumps over the lazy dog.
            </div>
          </div>
        </div>
      </section>

      {/* 3 — Buttons */}
      <section className="sg-section">
        <h2>3. Buttons</h2>
        <div className="card stack">
          <div className="row">
            <button>Primary</button>
            <button className="ghost">Ghost</button>
            <button className="danger">Danger</button>
            <button disabled>Disabled</button>
          </div>
          <div className="row">
            <button className="small">Small primary</button>
            <button className="small ghost">Small ghost</button>
            <button className="small danger">Small danger</button>
          </div>
          <div className="row">
            <button className="icon-btn"><Pin size={16} /></button>
            <button className="icon-btn"><Pencil size={16} /></button>
            <button className="icon-btn"><MoreVertical size={16} /></button>
            <button className="link-btn">Pokaż więcej <ChevronRight size={14} className="chevron" /></button>
          </div>
          <div className="row">
            <button className="tag-active">Wołowina</button>
            <button className="tag-inactive">Wieprzowina</button>
          </div>
        </div>
      </section>

      {/* 4 — Form controls */}
      <section className="sg-section">
        <h2>4. Form controls</h2>
        <div className="card dish-form-grid">
          <label>Nazwa dania
            <input type="text" placeholder="np. Kotlet schabowy" defaultValue="Żółta zupa ogórkowa" />
          </label>
          <label>Trudność
            <input type="number" defaultValue={3} min={1} max={5} />
          </label>
          <label>Mięso
            <select defaultValue="pork">
              <option value="beef">Wołowina</option>
              <option value="pork">Wieprzowina</option>
            </select>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>Notatka
            <textarea placeholder="Uwagi…" />
          </label>
        </div>
      </section>

      {/* 5 — Badges, difficulty bar, plan quality */}
      <section className="sg-section">
        <h2>5. Badges &amp; indicators</h2>
        <div className="card stack">
          <div className="row">
            <span className="badge">hard / wine</span>
            <span className="badge soft">soft / basil</span>
            <span className="badge gold">best tier / basil (no gold)</span>
          </div>
          <div className="row">
            <PlanSummary plan={mockPlan} dishMap={mockDishMap} />
          </div>
          <div className="row">
            <DifficultyBar value={2} capacity={3} label="2 / 3" />
            <DifficultyBar value={3} capacity={3} label="3 / 3" />
            <DifficultyBar value={5} capacity={3} label="5 / 3 przekroczone" />
          </div>
        </div>
      </section>

      {/* 6 — Cards / DayCard states */}
      <section className="sg-section">
        <h2>6. Cards &amp; DayCard states</h2>
        <div className="card" style={{ marginBottom: 16 }}>Plain <code>.card</code> on the paper zone.</div>
        <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          <DayCard meal={mockMeal({ date: '2026-09-07' })} day={mockDay({ date: '2026-09-07' })} dish={mockDish({})} tagMap={emptyTagMap} onClick={() => {}} onTogglePin={() => {}} />
          <DayCard meal={mockMeal({ date: '2026-09-05' })} day={mockDay({ date: '2026-09-05', difficultyCap: 5 })} dish={mockDish({ difficulty: 4 })} tagMap={emptyTagMap} onClick={() => {}} onTogglePin={() => {}} />
          <DayCard meal={mockMeal({ date: '2026-09-08', locked: true })} day={mockDay({ date: '2026-09-08' })} dish={mockDish({})} tagMap={emptyTagMap} onClick={() => {}} onTogglePin={() => {}} />
          <DayCard meal={mockMeal({ date: '2026-09-09' })} day={mockDay({ date: '2026-09-09', skip: true })} dish={null} tagMap={emptyTagMap} onClick={() => {}} onTogglePin={() => {}} />
          <DayCard meal={mockMeal({ date: '2026-08-20' })} day={mockDay({ date: '2026-08-20' })} dish={mockDish({})} tagMap={emptyTagMap} isPast onClick={() => {}} onTogglePin={() => {}} />
          <DayCard meal={mockMeal({ date: '2026-10-01' })} day={mockDay({ date: '2026-10-01' })} dish={mockDish({})} tagMap={emptyTagMap} monthStart onClick={() => {}} onTogglePin={() => {}} />
        </div>
      </section>

      {/* 7 — Violations */}
      <section className="sg-section">
        <h2>7. Violations panel</h2>
        <ViolationsPanel plan={mockPlan} />
      </section>

      {/* 8 — Tables, dish rows, empty state */}
      <section className="sg-section">
        <h2>8. Tables &amp; rows</h2>
        <div className="card stack">
          <table className="menu-table">
            <thead><tr><th>Kolumna</th><th>Alias</th><th>Wartości</th></tr></thead>
            <tbody>
              <tr><td><code>name</code></td><td>nazwa</td><td>tekst (wymagane)</td></tr>
              <tr><td><code>meat</code></td><td>mięso</td><td>wołowina / wieprzowina</td></tr>
            </tbody>
          </table>
          <div className="dish-row">
            <div style={{ fontWeight: 700 }}>Kotlet schabowy</div>
            <div>Wieprzowina</div>
            <div>Trudność 3</div>
            <div>Lubiane 4/5</div>
            <div>1 dzień</div>
            <button className="small ghost">Edytuj</button>
          </div>
          <div className="empty-state">Brak dań — dodaj pierwsze powyżej.</div>
        </div>
      </section>

      {/* 9 — Icons */}
      <section className="sg-section">
        <h2>9. Icons (Lucide)</h2>
        <div className="row">
          <div className="sg-zone-dark sg-zone-half">
            <div className="eyebrow" style={{ marginBottom: 10 }}>On the table (--ink)</div>
            <div className="row" style={{ color: 'var(--ink)' }}>
              <Sparkles /> <Calendar /> <CookingPot /> <Settings /> <Pin /> <Pencil /> <MoreVertical /> <ChevronRight /> <Check /> <X />
            </div>
            <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Meat icons</div>
            <div className="row" style={{ color: 'var(--ink)' }}>
              {(Object.keys(MEAT_LABELS) as Dish['meat'][]).map((m) => (
                <span key={m} className="row" style={{ gap: 4 }}><MeatIcon meat={m} size={18} /> {m}</span>
              ))}
            </div>
          </div>
          <div className="sg-zone-paper sg-zone-half">
            <div className="eyebrow" style={{ marginBottom: 10 }}>On paper (--paper-ink)</div>
            <div className="row" style={{ color: 'var(--paper-ink)' }}>
              <Sparkles /> <Calendar /> <CookingPot /> <Settings /> <Pin /> <Pencil /> <MoreVertical /> <ChevronRight /> <Check /> <X />
            </div>
          </div>
        </div>
      </section>

      {/* 11 — Contrast audit */}
      <section className="sg-section">
        <h2>11. Contrast audit (WCAG AA)</h2>
        <p className="muted">Reads live computed values, so this reflects theme: {theme} — toggle above and re-check.</p>
        <table className="menu-table">
          <thead><tr><th>Pair</th><th>Ratio</th><th>AA normal (4.5:1)</th><th>AA large / UI (3:1)</th></tr></thead>
          <tbody>
            {CONTRAST_TOKEN_PAIRS.map((p) => {
              const ratio = contrastRatio(resolveToken(p.fg), resolveToken(p.bg));
              const passNormal = meetsAA(ratio, false);
              const passLarge = meetsAA(ratio, true);
              return (
                <tr key={p.label}>
                  <td>{p.label}</td>
                  <td>{ratio.toFixed(2)}:1</td>
                  <td className={passNormal ? 'sg-pass' : 'sg-fail'}>{passNormal ? 'PASS' : 'FAIL'}</td>
                  <td className={passLarge ? 'sg-pass' : 'sg-fail'}>{passLarge ? 'PASS' : 'FAIL'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      </div>
    </div>
  );
}
