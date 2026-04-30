import { describe, it, expect } from 'vitest';
import { cascadeDeleteTag } from '../../src/lib/storage/tagCascade';
import type { TagDefinition } from '../../src/types/tag';
import type { Dish } from '../../src/types/dish';
import type { Plan } from '../../src/types/plan';

const tags: TagDefinition[] = [
  { id: 'tag-nanny', name: 'niania' },
  { id: 'tag-fast', name: 'szybkie' },
];

const dishes: Dish[] = [
  { id: 'd1', name: 'Ryba', meat: 'fish', difficulty: 2, preference: 3, tags: ['tag-nanny', 'tag-fast'], servesDays: 1 },
  { id: 'd2', name: 'Kotlet', meat: 'pork', difficulty: 3, preference: 5, tags: ['tag-nanny'], servesDays: 1 },
  { id: 'd3', name: 'Pasta', meat: 'none', difficulty: 1, preference: 5, tags: [], servesDays: 1 },
];

const plans: Plan[] = [
  {
    id: 'p1',
    createdAt: '2026-04-20T00:00:00.000Z',
    startDate: '2026-04-20',
    endDate: '2026-04-22',
    meals: [],
    fitness: 0,
    violations: [],
    dayModifiers: [
      { date: '2026-04-20', requiresTags: ['tag-nanny', 'tag-fast'] },
      { date: '2026-04-21', requiresTags: ['tag-fast'] },
      { date: '2026-04-22' },
    ],
  },
];

describe('cascadeDeleteTag', () => {
  it('removes tag from tagDefinitions', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, plans });
    expect(result.tagDefinitions.map((t) => t.id)).not.toContain('tag-nanny');
    expect(result.tagDefinitions).toHaveLength(1);
  });

  it('strips deleted tag from all dish tags', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, plans });
    for (const d of result.dishes) {
      expect(d.tags).not.toContain('tag-nanny');
    }
  });

  it('leaves other tags on dishes intact', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, plans });
    expect(result.dishes[0].tags).toContain('tag-fast');
  });

  it('strips deleted tag from plan dayModifier requiresTags', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, plans });
    const mods = result.plans[0].dayModifiers ?? [];
    expect(mods[0].requiresTags).not.toContain('tag-nanny');
  });

  it('leaves other requiresTags intact', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, plans });
    const mods = result.plans[0].dayModifiers ?? [];
    expect(mods[0].requiresTags).toContain('tag-fast');
    expect(mods[1].requiresTags).toContain('tag-fast');
  });

  it('dishes with no matching tag are unchanged', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, plans });
    expect(result.dishes[2].tags).toEqual([]);
  });

  it('day modifiers without requiresTags are not affected', () => {
    const result = cascadeDeleteTag('tag-nanny', { tagDefinitions: tags, dishes, plans });
    const mods = result.plans[0].dayModifiers ?? [];
    expect(mods[2].requiresTags).toBeUndefined();
  });

  it('no-op for non-existent tag id', () => {
    const result = cascadeDeleteTag('ghost-tag', { tagDefinitions: tags, dishes, plans });
    expect(result.tagDefinitions).toHaveLength(tags.length);
    expect(result.dishes[0].tags).toEqual(dishes[0].tags);
  });
});
