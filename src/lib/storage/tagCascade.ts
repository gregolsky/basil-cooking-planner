import type { Dish } from '../../types/dish';
import type { DayModifier } from '../../types/day';
import type { TagDefinition } from '../../types/tag';

export interface TagCascadeState {
  tagDefinitions: TagDefinition[];
  dishes: Dish[];
  dayModifiers: DayModifier[];
}

export function cascadeDeleteTag(id: string, state: TagCascadeState): TagCascadeState {
  return {
    tagDefinitions: state.tagDefinitions.filter((t) => t.id !== id),
    dishes: state.dishes.map((d) => ({ ...d, tags: d.tags.filter((t) => t !== id) })),
    dayModifiers: state.dayModifiers.map((m) => ({
      ...m,
      requiresTags: m.requiresTags?.filter((t) => t !== id),
    })),
  };
}
