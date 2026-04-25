import { describe, it, expect } from 'vitest';
import { cascadeDeleteTag } from '../../src/lib/storage/tagCascade';
import type { TagDefinition } from '../../src/types/tag';
import type { Dish } from '../../src/types/dish';
import type { DayModifier } from '../../src/types/day';

const tags: TagDefinition[] = [
  { id: 'tag-nanny', name: 'niania' },
  { id: 'tag-fast', name: 'szybkie' },
];

const dishes: Dish[] = [
  { id: 'd1', name: 'Ryba', meat: 'fish', difficulty: 2, preference: 3, tags: ['tag-nanny', 'tag-fast'], servesDays: 1 },
  { id: 'd2', name: 'Kotlet', meat: 'pork', difficulty: 3, preference: 5, tags: ['tag-nanny'], servesDays: 1 },
  { id: 'd3', name: 'Pasta', meat: 'none', difficulty: 1, preference: 5, tags: [], servesDays: 1 },
];

const dayModifiers: DayModifier[] = [
  { date: '2026-04-20', requiresTags: ['tag-nanny', 'tag-fast'] },
  { date: '2026-04-21', requiresTags: ['tag-fast'] },
  { date: '2026-04-22' },
];

describe('cascadeDeleteTag', () => {
  it('removes tag from tagDefinitions', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, dayModifiers });
    expect(result.tagDefinitions.map((t) => t.id)).not.toContain('tag-nanny');
    expect(result.tagDefinitions).toHaveLength(1);
  });

  it('strips deleted tag from all dish tags', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, dayModifiers });
    for (const d of result.dishes) {
      expect(d.tags).not.toContain('tag-nanny');
    }
  });

  it('leaves other tags on dishes intact', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, dayModifiers });
    expect(result.dishes[0].tags).toContain('tag-fast');
  });

  it('strips deleted tag from dayModifier requiresTags', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, dayModifiers });
    expect(result.dayModifiers[0].requiresTags).not.toContain('tag-nanny');
  });

  it('leaves other requiresTags intact', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, dayModifiers });
    expect(result.dayModifiers[0].requiresTags).toContain('tag-fast');
    expect(result.dayModifiers[1].requiresTags).toContain('tag-fast');
  });

  it('dishes with no matching tag are unchanged', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, dayModifiers });
    expect(result.dishes[2].tags).toEqual([]);
  });

  it('day modifiers without requiresTags are not affected', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, dayModifiers });
    expect(result.dayModifiers[2].requiresTags).toBeUndefined();
  });

  it('no-op for non-existent tag id', () => {
    const result = cascadeDeleteTag('ghost-tag', { tagDefinitions: tags, dishes, dayModifiers });
    expect(result.tagDefinitions).toHaveLength(tags.length);
    expect(result.dishes[0].tags).toEqual(dishes[0].tags);
  });
});
