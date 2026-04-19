import { z } from 'zod';

export const SCHEMA_VERSION = 1;

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

export const dayModifierSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wifeDuty: z.boolean().optional(),
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
});

export const appDataSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  familyName: z.string().nullable().optional(),
  weekStartDay: z.union([z.literal(0), z.literal(1)]).optional(),
  dishes: z.array(dishSchema),
  dayModifiers: z.array(dayModifierSchema),
  plans: z.array(planSchema),
  activePlanId: z.string().nullable(),
  tagDefinitions: z.array(tagDefinitionSchema).default([]),
});

export type AppData = z.infer<typeof appDataSchema>;
