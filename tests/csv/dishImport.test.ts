import { describe, it, expect } from 'vitest';
import { parseDishCsv, DISH_CSV_SAMPLE } from '../../src/lib/csv/dishImport';

describe('parseDishCsv', () => {
  it('empty string returns warning', () => {
    const { dishes, warnings } = parseDishCsv('');
    expect(dishes).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('header-only CSV returns no dishes and no warnings', () => {
    const { dishes, warnings } = parseDishCsv('name;meat;difficulty;preference;servesDays;tags');
    expect(dishes).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('missing name column returns error warning', () => {
    const { dishes, warnings } = parseDishCsv('meat;difficulty\npork;3');
    expect(dishes).toHaveLength(0);
    expect(warnings.some((w) => w.includes('name') || w.includes('nazwa'))).toBe(true);
  });

  it('parses English headers', () => {
    const csv = 'name,meat,difficulty,preference,servesDays\nPasta,pork,3,4,1';
    const { dishes } = parseDishCsv(csv);
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Pasta');
    expect(dishes[0].meat).toBe('pork');
  });

  it('parses Polish headers', () => {
    const csv = 'nazwa;mięso;trudność;preferencja;starcza\nKotlet;wieprzowina;3;5;1';
    const { dishes } = parseDishCsv(csv);
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Kotlet');
    expect(dishes[0].meat).toBe('pork');
    expect(dishes[0].difficulty).toBe(3);
  });

  it('auto-detects semicolon delimiter', () => {
    const csv = 'name;meat\nKotlet;pork';
    const { dishes } = parseDishCsv(csv);
    expect(dishes).toHaveLength(1);
  });

  it('auto-detects tab delimiter', () => {
    const csv = 'name\tmeat\nKotlet\tpork';
    const { dishes } = parseDishCsv(csv);
    expect(dishes).toHaveLength(1);
  });

  it('auto-detects comma delimiter', () => {
    const csv = 'name,meat\nKotlet,pork';
    const { dishes } = parseDishCsv(csv);
    expect(dishes).toHaveLength(1);
  });

  it('handles quoted fields with embedded delimiter', () => {
    const csv = 'name;meat\n"Kotlet; schabowy";pork';
    const { dishes } = parseDishCsv(csv);
    expect(dishes[0].name).toBe('Kotlet; schabowy');
  });

  it('strips BOM from input', () => {
    const csv = '\uFEFFname;meat\nKotlet;pork';
    const { dishes } = parseDishCsv(csv);
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Kotlet');
  });

  it('maps all Polish meat aliases', () => {
    const cases: [string, string][] = [
      ['wołowina', 'beef'],
      ['wieprzowina', 'pork'],
      ['drób', 'poultry'],
      ['ryba', 'fish'],
      ['bezmięsne', 'none'],
      ['wege', 'none'],
    ];
    for (const [alias, expected] of cases) {
      const { dishes } = parseDishCsv(`name;meat\nDanie;${alias}`);
      expect(dishes[0].meat).toBe(expected);
    }
  });

  it('maps all English meat aliases', () => {
    const cases: [string, string][] = [
      ['beef', 'beef'],
      ['pork', 'pork'],
      ['poultry', 'poultry'],
      ['fish', 'fish'],
      ['none', 'none'],
    ];
    for (const [alias, expected] of cases) {
      const { dishes } = parseDishCsv(`name;meat\nDanie;${alias}`);
      expect(dishes[0].meat).toBe(expected);
    }
  });

  it('unknown meat type defaults to none with warning', () => {
    const { dishes, warnings } = parseDishCsv('name;meat\nDanie;alien');
    expect(dishes[0].meat).toBe('none');
    expect(warnings.some((w) => w.includes('alien'))).toBe(true);
  });

  it('difficulty=0 is falsy so falls back to default 2; difficulty=10 is clamped to 5', () => {
    const csv = 'name;difficulty\nDanie1;0\nDanie2;10';
    const { dishes } = parseDishCsv(csv);
    expect(dishes[0].difficulty).toBe(2); // 0 is falsy → default 2
    expect(dishes[1].difficulty).toBe(5); // 10 clamped to 5
  });

  it('clamps servesDays: 0→1, 5→3', () => {
    const csv = 'name;servesDays\nDanie1;0\nDanie2;5';
    const { dishes } = parseDishCsv(csv);
    expect(dishes[0].servesDays).toBe(1);
    expect(dishes[1].servesDays).toBe(3);
  });

  it('empty name row is skipped with a warning', () => {
    const csv = 'name;meat\n;pork\nKotlet;pork';
    const { dishes, warnings } = parseDishCsv(csv);
    expect(dishes).toHaveLength(1);
    expect(warnings.some((w) => w.includes('brak nazwy'))).toBe(true);
  });

  it('missing optional fields use defaults', () => {
    const { dishes } = parseDishCsv('name\nDanie');
    expect(dishes[0].difficulty).toBe(2);
    expect(dishes[0].preference).toBe(3);
    expect(dishes[0].servesDays).toBe(1);
    expect(dishes[0].meat).toBe('none');
  });

  it('resolves tag names to IDs via tagNameToId map', () => {
    const tagMap = new Map([['niania', 'tag-nanny']]);
    const csv = 'name;tags\nDanie;niania';
    const { dishes } = parseDishCsv(csv, tagMap);
    expect(dishes[0].tags).toContain('tag-nanny');
  });

  it('unknown tag with non-empty tagMap generates warning', () => {
    const tagMap = new Map([['niania', 'tag-nanny']]);
    const csv = 'name;tags\nDanie;nieznana';
    const { dishes, warnings } = parseDishCsv(csv, tagMap);
    expect(dishes[0].tags).toHaveLength(0);
    expect(warnings.some((w) => w.includes('nieznana'))).toBe(true);
  });

  it('splits tags by pipe separator', () => {
    const csv = 'name;tags\nDanie;tagA|tagB';
    const { dishes } = parseDishCsv(csv);
    expect(dishes[0].tags).toContain('tagA');
    expect(dishes[0].tags).toContain('tagB');
  });

  it('splits tags by comma separator', () => {
    const csv = 'name;tags\nDanie;tagA,tagB';
    const { dishes } = parseDishCsv(csv);
    expect(dishes[0].tags).toContain('tagA');
    expect(dishes[0].tags).toContain('tagB');
  });

  it('DISH_CSV_SAMPLE parses without errors', () => {
    const { dishes, warnings } = parseDishCsv(DISH_CSV_SAMPLE);
    expect(dishes.length).toBeGreaterThan(0);
    expect(warnings).toHaveLength(0);
  });

  it('each parsed dish has a unique id', () => {
    const csv = 'name\nDanie1\nDanie2\nDanie3';
    const { dishes } = parseDishCsv(csv);
    const ids = dishes.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
