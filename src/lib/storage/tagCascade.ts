import type { Dish } from '../../types/dish';
import type { Plan } from '../../types/plan';
import type { TagDefinition } from '../../types/tag';

export interface TagCascadeState {
  tagDefinitions: TagDefinition[];
  dishes: Dish[];
  plans: Plan[];
}

export function cascadeDeleteTag(id: string, state: TagCascadeState): TagCascadeState {
  return {
    tagDefinitions: state.tagDefinitions.filter((t) => t.id !== id),
    dishes: state.dishes.map((d) => ({ ...d, tags: d.tags.filter((t) => t !== id) })),
    plans: state.plans.map((p) => ({
      ...p,
      dayModifiers: (p.dayModifiers ?? []).map((m) => ({
        ...m,
        requiresTags: m.requiresTags?.filter((t) => t !== id),
      })),
    })),
  };
}
