import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Dish } from '../types/dish';
import type { Plan, PlannedMeal } from '../types/plan';
import type { TagDefinition } from '../types/tag';
import { SCHEMA_VERSION } from '../lib/storage/schema';
import { normalizeDishTags } from '../lib/storage/normalize';
import { cascadeDeleteTag } from '../lib/storage/tagCascade';
import { duplicatePlanData } from '../lib/plan/duplicate';
import i18n from '../i18n/index';

interface AppState {
  schemaVersion: number;
  familyName: string | null;
  locale: 'pl' | 'en';
  theme: 'trattoria' | 'prl';
  weekStartDay: 0 | 1;
  sameMeatPenalty: number;
  dishes: Dish[];
  plans: Plan[];
  activePlanId: string | null;
  tagDefinitions: TagDefinition[];

  setFamilyName: (name: string) => void;
  setLocale: (locale: 'pl' | 'en') => void;
  setTheme: (theme: 'trattoria' | 'prl') => void;
  setWeekStartDay: (day: 0 | 1) => void;
  setSameMeatPenalty: (value: number) => void;
  upsertDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;

  upsertTag: (tag: TagDefinition) => void;
  deleteTag: (id: string) => void;

  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, updater: (p: Plan) => Plan) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string | null) => void;
  duplicatePlan: (id: string) => string | null;

  replaceMeal: (planId: string, date: string, meal: PlannedMeal) => void;

  replaceAll: (data: {
    familyName?: string | null;
    weekStartDay?: 0 | 1;
    dishes: Dish[];
    plans: Plan[];
    activePlanId: string | null;
    tagDefinitions: TagDefinition[];
  }) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      familyName: null,
      locale: 'pl',
      theme: 'trattoria',
      weekStartDay: 1,
      sameMeatPenalty: 1000,
      dishes: [],
      plans: [],
      activePlanId: null,
      tagDefinitions: [],

      setFamilyName: (name) => set({ familyName: name.trim() || null }),
      setLocale: (locale) => { i18n.changeLanguage(locale); set({ locale }); },
      setTheme: (theme) => {
        if (theme === 'prl') document.documentElement.dataset.theme = 'prl';
        else delete document.documentElement.dataset.theme;
        set({ theme });
      },
      setWeekStartDay: (day) => set({ weekStartDay: day }),
      setSameMeatPenalty: (value) => set({ sameMeatPenalty: value }),

      upsertDish: (dish) =>
        set((s) => {
          const idx = s.dishes.findIndex((d) => d.id === dish.id);
          if (idx === -1) return { dishes: [...s.dishes, dish] };
          const next = s.dishes.slice();
          next[idx] = dish;
          return { dishes: next };
        }),

      deleteDish: (id) =>
        set((s) => ({ dishes: s.dishes.filter((d) => d.id !== id) })),

      upsertTag: (tag) =>
        set((s) => {
          const idx = s.tagDefinitions.findIndex((t) => t.id === tag.id);
          if (idx === -1) return { tagDefinitions: [...s.tagDefinitions, tag] };
          const next = s.tagDefinitions.slice();
          next[idx] = tag;
          return { tagDefinitions: next };
        }),

      deleteTag: (id) =>
        set((s) => cascadeDeleteTag(id, s)),

      addPlan: (plan) =>
        set((s) => ({ plans: [...s.plans, plan], activePlanId: plan.id })),

      updatePlan: (id, updater) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? updater(p) : p)),
        })),

      deletePlan: (id) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
          activePlanId: s.activePlanId === id ? null : s.activePlanId,
        })),

      setActivePlan: (id) => set({ activePlanId: id }),

      duplicatePlan: (id) => {
        const plan = get().plans.find((p) => p.id === id);
        if (!plan) return null;
        const copy = duplicatePlanData(plan, i18n.t('plans.copySuffix'));
        set((s) => ({ plans: [...s.plans, copy], activePlanId: copy.id }));
        return copy.id;
      },

      replaceMeal: (planId, date, meal) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id !== planId
              ? p
              : { ...p, meals: p.meals.map((m) => (m.date === date ? meal : m)) },
          ),
        })),

      replaceAll: (data) =>
        set({
          ...(data.familyName !== undefined ? { familyName: data.familyName } : {}),
          ...(data.weekStartDay !== undefined ? { weekStartDay: data.weekStartDay } : {}),
          dishes: normalizeDishTags(data.dishes, data.tagDefinitions),
          plans: data.plans,
          activePlanId: data.activePlanId,
          tagDefinitions: data.tagDefinitions,
        }),

      reset: () =>
        set({
          familyName: null,
          dishes: [],
          plans: [],
          activePlanId: null,
          tagDefinitions: [],
        }),
    }),
    {
      name: 'family-cooking-planner',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          const state = persistedState as Record<string, unknown>;
          const globalModifiers: Array<Record<string, unknown>> =
            Array.isArray(state['dayModifiers']) ? (state['dayModifiers'] as Array<Record<string, unknown>>) : [];
          const globalLimits: Array<Record<string, unknown>> =
            Array.isArray(state['cumulativeLimits']) ? (state['cumulativeLimits'] as Array<Record<string, unknown>>) : [];

          const plans = Array.isArray(state['plans'])
            ? (state['plans'] as Array<Record<string, unknown>>).map((plan) => ({
                ...plan,
                dayModifiers: globalModifiers.filter(
                  (m) => typeof m['date'] === 'string' &&
                    typeof plan['startDate'] === 'string' &&
                    typeof plan['endDate'] === 'string' &&
                    m['date'] >= (plan['startDate'] as string) &&
                    m['date'] <= (plan['endDate'] as string),
                ),
                cumulativeLimits: globalLimits.filter(
                  (l) => typeof l['startDate'] === 'string' &&
                    typeof l['endDate'] === 'string' &&
                    typeof plan['startDate'] === 'string' &&
                    typeof plan['endDate'] === 'string' &&
                    (l['startDate'] as string) <= (plan['endDate'] as string) &&
                    (l['endDate'] as string) >= (plan['startDate'] as string),
                ),
              }))
            : [];

          const { dayModifiers: _dm, cumulativeLimits: _cl, ...rest } = state;
          void _dm; void _cl;
          return { ...rest, schemaVersion: SCHEMA_VERSION, plans };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const normalized = normalizeDishTags(state.dishes, state.tagDefinitions);
        if (normalized !== state.dishes) state.dishes = normalized;
        if (state.locale) i18n.changeLanguage(state.locale);
        if (state.theme === 'prl') document.documentElement.dataset.theme = 'prl';
        else delete document.documentElement.dataset.theme;
      },
    },
  ),
);
