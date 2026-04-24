import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Dish } from '../types/dish';
import type { DayModifier, CumulativeLimit } from '../types/day';
import type { Plan, PlannedMeal } from '../types/plan';
import type { TagDefinition } from '../types/tag';
import { SCHEMA_VERSION } from '../lib/storage/schema';
import { normalizeDishTags } from '../lib/storage/normalize';
import { uid } from '../lib/utils/id';
import i18n from '../i18n/index';

interface AppState {
  schemaVersion: number;
  familyName: string | null;
  locale: 'pl' | 'en';
  weekStartDay: 0 | 1;
  dishes: Dish[];
  dayModifiers: DayModifier[];
  plans: Plan[];
  activePlanId: string | null;
  tagDefinitions: TagDefinition[];
  cumulativeLimits: CumulativeLimit[];

  setFamilyName: (name: string) => void;
  setLocale: (locale: 'pl' | 'en') => void;
  setWeekStartDay: (day: 0 | 1) => void;
  upsertDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;

  upsertTag: (tag: TagDefinition) => void;
  deleteTag: (id: string) => void;

  upsertDayModifier: (mod: DayModifier) => void;
  clearDayModifier: (date: string) => void;

  upsertCumulativeLimit: (limit: CumulativeLimit) => void;
  deleteCumulativeLimit: (id: string) => void;

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
    dayModifiers: DayModifier[];
    plans: Plan[];
    activePlanId: string | null;
    tagDefinitions: TagDefinition[];
    cumulativeLimits?: CumulativeLimit[];
  }) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      familyName: null,
      locale: 'pl',
      weekStartDay: 1,
      dishes: [],
      dayModifiers: [],
      plans: [],
      activePlanId: null,
      tagDefinitions: [],
      cumulativeLimits: [],

      setFamilyName: (name) => set({ familyName: name.trim() || null }),
      setLocale: (locale) => { i18n.changeLanguage(locale); set({ locale }); },
      setWeekStartDay: (day) => set({ weekStartDay: day }),

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
        set((s) => ({
          tagDefinitions: s.tagDefinitions.filter((t) => t.id !== id),
          dishes: s.dishes.map((d) => ({ ...d, tags: d.tags.filter((t) => t !== id) })),
          dayModifiers: s.dayModifiers.map((m) => ({
            ...m,
            requiresTags: m.requiresTags?.filter((t) => t !== id),
          })),
        })),

      upsertDayModifier: (mod) =>
        set((s) => {
          const idx = s.dayModifiers.findIndex((m) => m.date === mod.date);
          if (idx === -1) return { dayModifiers: [...s.dayModifiers, mod] };
          const next = s.dayModifiers.slice();
          next[idx] = mod;
          return { dayModifiers: next };
        }),

      clearDayModifier: (date) =>
        set((s) => ({ dayModifiers: s.dayModifiers.filter((m) => m.date !== date) })),

      upsertCumulativeLimit: (limit) =>
        set((s) => {
          const idx = s.cumulativeLimits.findIndex((l) => l.id === limit.id);
          if (idx === -1) return { cumulativeLimits: [...s.cumulativeLimits, limit] };
          const next = s.cumulativeLimits.slice();
          next[idx] = limit;
          return { cumulativeLimits: next };
        }),

      deleteCumulativeLimit: (id) =>
        set((s) => ({ cumulativeLimits: s.cumulativeLimits.filter((l) => l.id !== id) })),

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
        const copy: Plan = {
          ...plan,
          id: uid(),
          name: (plan.name ?? 'Plan') + ' ' + i18n.t('plans.copySuffix'),
          createdAt: new Date().toISOString(),
          meals: plan.meals.map((m) => ({ ...m })),
          violations: plan.violations.map((v) => ({ ...v })),
        };
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
          dayModifiers: data.dayModifiers,
          plans: data.plans,
          activePlanId: data.activePlanId,
          tagDefinitions: data.tagDefinitions,
          cumulativeLimits: data.cumulativeLimits ?? [],
        }),

      reset: () =>
        set({
          familyName: null,
          dishes: [],
          dayModifiers: [],
          plans: [],
          activePlanId: null,
          tagDefinitions: [],
          cumulativeLimits: [],
        }),
    }),
    {
      name: 'family-cooking-planner',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const normalized = normalizeDishTags(state.dishes, state.tagDefinitions);
        if (normalized !== state.dishes) state.dishes = normalized;
        if (state.locale) i18n.changeLanguage(state.locale);
      },
    },
  ),
);
