import type { Dish, MeatType } from '../../types/dish';
import { uid } from '../utils/id';

export interface DishImportResult {
  dishes: Dish[];
  warnings: string[];
}

const MEAT_ALIASES: Record<string, MeatType> = {
  beef: 'beef',
  wolowina: 'beef',
  wołowina: 'beef',
  pork: 'pork',
  wieprzowina: 'pork',
  wieprzowe: 'pork',
  poultry: 'poultry',
  drob: 'poultry',
  drób: 'poultry',
  kurczak: 'poultry',
  indyk: 'poultry',
  fish: 'fish',
  ryba: 'fish',
  none: 'none',
  bezmiesne: 'none',
  bezmięsne: 'none',
  wege: 'none',
  vege: 'none',
  wegetarianskie: 'none',
  wegetariańskie: 'none',
};

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  nazwa: 'name',
  meat: 'meat',
  mieso: 'meat',
  mięso: 'meat',
  difficulty: 'difficulty',
  trudnosc: 'difficulty',
  trudność: 'difficulty',
  prep: 'prepTimeMin',
  preptime: 'prepTimeMin',
  preptimemin: 'prepTimeMin',
  czas: 'prepTimeMin',
  minuty: 'prepTimeMin',
  preference: 'preference',
  preferencja: 'preference',
  kidsrating: 'preference',
  serves: 'servesDays',
  servesdays: 'servesDays',
  starcza: 'servesDays',
  tags: 'tags',
  etykiety: 'tags',
  notes: 'notes',
  notatki: 'notes',
};

function detectDelimiter(line: string): string {
  const counts = { ',': 0, ';': 0, '\t': 0 };
  for (const ch of line) if (ch in counts) counts[ch as keyof typeof counts]++;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ',';
}

function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delim) { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normalizeHeader(h: string): string {
  const k = h.trim().toLowerCase().replace(/\s+/g, '').replace(/[._-]/g, '');
  return HEADER_ALIASES[k] ?? k;
}

function clamp1to5(n: number): 1 | 2 | 3 | 4 | 5 {
  const x = Math.round(n);
  return (Math.max(1, Math.min(5, x)) as 1 | 2 | 3 | 4 | 5);
}

function clampServes(n: number): 1 | 2 | 3 {
  const x = Math.round(n);
  return (Math.max(1, Math.min(3, x)) as 1 | 2 | 3);
}

export function parseDishCsv(text: string, tagNameToId?: Map<string, string>): DishImportResult {
  const stripped = text.replace(/^\uFEFF/, '');
  const lines = stripped.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const warnings: string[] = [];
  if (lines.length === 0) return { dishes: [], warnings: ['Plik jest pusty.'] };

  const delim = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delim).map(normalizeHeader);
  const idx = (name: string) => headers.indexOf(name);

  if (idx('name') === -1) {
    return { dishes: [], warnings: [`Brak kolumny "name" / "nazwa" (delimiter: "${delim}").`] };
  }

  const dishes: Dish[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li], delim);
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 ? cells[i] ?? '' : '';
    };

    const name = get('name');
    if (!name) { warnings.push(`Linia ${li + 1}: brak nazwy — pomijam.`); continue; }

    const meatRaw = get('meat').toLowerCase();
    const meat = MEAT_ALIASES[meatRaw] ?? 'none';
    if (meatRaw && !MEAT_ALIASES[meatRaw]) {
      warnings.push(`Linia ${li + 1} ("${name}"): nieznany rodzaj mięsa "${meatRaw}" — ustawiam bezmięsne.`);
    }

    const difficulty = clamp1to5(Number(get('difficulty')) || 2);
    const preference = clamp1to5(Number(get('preference')) || 3);
    const servesDays = clampServes(Number(get('servesDays')) || 1);
    const prepTimeMin = Math.max(0, Math.round(Number(get('prepTimeMin')) || 30));

    const tagsRaw = get('tags');
    const tagNames = tagsRaw
      ? tagsRaw.split(/[|,]/).map((s) => s.trim()).filter(Boolean)
      : [];
    const tags: string[] = [];
    for (const tn of tagNames) {
      if (tagNameToId?.has(tn.toLowerCase())) tags.push(tagNameToId.get(tn.toLowerCase())!);
      else if (tagNameToId && tagNameToId.size > 0) {
        warnings.push(`Linia ${li + 1} ("${name}"): etykieta "${tn}" nie jest zdefiniowana — pomijam.`);
      } else {
        tags.push(tn);
      }
    }

    dishes.push({
      id: uid(),
      name: name.trim(),
      meat,
      difficulty,
      prepTimeMin,
      preference,
      tags,
      servesDays,
      notes: get('notes') || undefined,
    });
  }

  return { dishes, warnings };
}

export const DISH_CSV_SAMPLE =
  `name;meat;difficulty;prepTimeMin;preference;servesDays;tags;notes
Kotlet schabowy;wieprzowina;3;45;5;1;;klasyka rodzinna
Rosół;drób;2;90;4;2;niania;gotuje się sam
Ryba z pieca;ryba;2;30;3;1;niania;z cytryną
Makaron z sosem;bezmięsne;1;20;5;1;niania|szybkie;
Gulasz wołowy;wołowina;4;120;3;2;;dużo warzyw
Pizza zamawiana;bezmięsne;1;0;5;1;zamawiane;raz na 2 tygodnie`;
