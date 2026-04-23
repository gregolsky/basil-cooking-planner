import type { Dish } from '../../types/dish';
import type { TagDefinition } from '../../types/tag';

export function normalizeDishTags(dishes: Dish[], tagDefs: TagDefinition[]): Dish[] {
  if (tagDefs.length === 0) return dishes;
  const idSet = new Set(tagDefs.map((t) => t.id));
  const nameToId = new Map<string, string>();
  for (const t of tagDefs) nameToId.set(t.name.toLowerCase(), t.id);

  return dishes.map((d) => {
    const resolved: string[] = [];
    for (const raw of d.tags) {
      if (idSet.has(raw)) { resolved.push(raw); continue; }
      const byName = nameToId.get(raw.toLowerCase());
      if (byName) { resolved.push(byName); continue; }
      // orphan tag (deleted or never defined) — drop
    }
    const unique = Array.from(new Set(resolved));
    const changed = unique.length !== d.tags.length || unique.some((t, i) => t !== d.tags[i]);
    return changed ? { ...d, tags: unique } : d;
  });
}
