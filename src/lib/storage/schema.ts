import { z } from 'zod';

export const SCHEMA_VERSION = 2;

const meatSchema = z.enum(['beef', 'pork', 'poultry', 'fish', 'none']);
const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const ratingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const servesDaysSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const tagDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  maxPerWeek: z.number().int().positive().optional(),
  minGapDays: z.number().int().positive().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export const dishSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  meat: meatSchema,
  difficulty: difficultySchema,
  prepTimeMin: z.number().int().nonnegative().optional(),
  preference: ratingSchema,
  tags: z.array(z.string()).default([]),
  servesDays: servesDaysSchema,
  notes: z.string().optional(),
});

export const cumulativeLimitSchema = z.object({
  id: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxTotal: z.number().int().positive(),
});

export const dayModifierSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  skip: z.boolean().optional(),
  requiresTags: z.array(z.string()).optional(),
  difficultyCap: z.number().int().optional(),
  note: z.string().optional(),
});

export const plannedMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dishId: z.string().nullable(),
  isLeftover: z.boolean(),
  sourceDate: z.string().optional(),
  locked: z.boolean(),
});

export const violationSchema = z.object({
  date: z.string(),
  severity: z.enum(['hard', 'soft', 'info']),
  kind: z.string(),
  message: z.string(),
});

export const planSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  createdAt: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  meals: z.array(plannedMealSchema),
  fitness: z.number(),
  violations: z.array(violationSchema),
  dayModifiers: z.array(dayModifierSchema).default([]),
  cumulativeLimits: z.array(cumulativeLimitSchema).default([]),
});

export const appDataSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  familyName: z.string().nullable().optional(),
  weekStartDay: z.union([z.literal(0), z.literal(1)]).optional(),
  dishes: z.array(dishSchema),
  plans: z.array(planSchema),
  activePlanId: z.string().nullable(),
  tagDefinitions: z.array(tagDefinitionSchema).default([]),
});

export type AppData = z.infer<typeof appDataSchema>;

/**
 * Migrates v1 app data (global dayModifiers/cumulativeLimits) to v2
 * (per-plan dayModifiers/cumulativeLimits), distributing modifiers into
 * plans by date overlap.
 */
export function migrateV1toV2(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const r = raw as Record<string, unknown>;
  if (r['schemaVersion'] !== 1) return raw;

  const globalModifiers: Array<Record<string, unknown>> =
    Array.isArray(r['dayModifiers']) ? (r['dayModifiers'] as Array<Record<string, unknown>>) : [];
  const globalLimits: Array<Record<string, unknown>> =
    Array.isArray(r['cumulativeLimits']) ? (r['cumulativeLimits'] as Array<Record<string, unknown>>) : [];

  const plans = Array.isArray(r['plans'])
    ? (r['plans'] as Array<Record<string, unknown>>).map((plan) => ({
        ...plan,
        dayModifiers: globalModifiers.filter(
          (m) => typeof m['date'] === 'string' &&
            typeof plan['startDate'] === 'string' &&
            typeof plan['endDate'] === 'string' &&
            m['date'] >= plan['startDate'] &&
            m['date'] <= plan['endDate'],
        ),
        cumulativeLimits: globalLimits.filter(
          (l) => typeof l['startDate'] === 'string' &&
            typeof l['endDate'] === 'string' &&
            typeof plan['startDate'] === 'string' &&
            typeof plan['endDate'] === 'string' &&
            l['startDate'] <= plan['endDate'] &&
            l['endDate'] >= plan['startDate'],
        ),
      }))
    : [];

  const { dayModifiers: _dm, cumulativeLimits: _cl, ...rest } = r;
  void _dm; void _cl;
  return { ...rest, schemaVersion: 2, plans };
}
