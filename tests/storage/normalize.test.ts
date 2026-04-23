import { describe, it, expect } from 'vitest';
import { normalizeDishTags } from '../../src/lib/storage/normalize';
import type { Dish } from '../../src/types/dish';
import type { TagDefinition } from '../../src/types/tag';

const tag = (id: string, name: string): TagDefinition => ({ id, name });
const dish = (id: string, tags: string[]): Dish => ({
  id, name: id, meat: 'none', difficulty: 2, preference: 3, tags, servesDays: 1,
});

describe('normalizeDishTags', () => {
  it('drops orphan tag ids not in tagDefs', () => {
    const result = normalizeDishTags([dish('d1', ['orphan', 't1'])], [tag('t1', 'Wege')]);
    expect(result[0].tags).toEqual(['t1']);
  });

  it('resolves tag by name (case-insensitive)', () => {
    const result = normalizeDishTags([dish('d1', ['wege'])], [tag('t1', 'Wege')]);
    expect(result[0].tags).toEqual(['t1']);
  });

  it('deduplicates resolved tags', () => {
    // dish has both the id and the name pointing to same tag
    const result = normalizeDishTags([dish('d1', ['t1', 'wege'])], [tag('t1', 'Wege')]);
    expect(result[0].tags).toEqual(['t1']);
  });

  it('returns same dish reference when nothing changed', () => {
    const dishes = [dish('d1', ['t1'])];
    const result = normalizeDishTags(dishes, [tag('t1', 'Wege')]);
    expect(result[0]).toBe(dishes[0]);
  });

  it('returns original array when tagDefs is empty', () => {
    const dishes = [dish('d1', ['t1'])];
    const result = normalizeDishTags(dishes, []);
    expect(result).toBe(dishes);
  });
});
