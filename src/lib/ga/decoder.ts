import type { Dish } from '../../types/dish';
import type { PlannedMeal } from '../../types/plan';
import type { DayContext } from '../days/capacity';
import type { Chromosome } from './types';

export interface DecodeContext {
  days: DayContext[];
  dishMap: Map<string, Dish>;
  lockedMeals: Map<string, PlannedMeal>;
}

export function decode(chromosome: Chromosome, ctx: DecodeContext): PlannedMeal[] {
  const meals: PlannedMeal[] = [];
  let leftoverRemaining = 0;
  let leftoverSourceDate: string | undefined;
  let leftoverDishId: string | null = null;

  for (let i = 0; i < ctx.days.length; i++) {
    const day = ctx.days[i];

    if (leftoverRemaining > 0 && leftoverDishId) {
      const locked = ctx.lockedMeals.get(day.date);
      if (locked) {
        meals.push({ ...locked });
        leftoverRemaining = 0;
        leftoverSourceDate = undefined;
        leftoverDishId = null;
        if (locked.dishId) {
          const dish = ctx.dishMap.get(locked.dishId);
          if (dish && dish.servesDays > 1) {
            leftoverRemaining = dish.servesDays - 1;
            leftoverSourceDate = locked.date;
            leftoverDishId = locked.dishId;
          }
        }
        continue;
      }

      meals.push({
        date: day.date,
        dishId: leftoverDishId,
        isLeftover: true,
        sourceDate: leftoverSourceDate,
        locked: false,
      });
      leftoverRemaining -= 1;
      if (leftoverRemaining === 0) {
        leftoverSourceDate = undefined;
        leftoverDishId = null;
      }
      continue;
    }

    const locked = ctx.lockedMeals.get(day.date);
    if (locked) {
      meals.push({ ...locked });
      if (locked.dishId) {
        const dish = ctx.dishMap.get(locked.dishId);
        if (dish && dish.servesDays > 1) {
          leftoverRemaining = dish.servesDays - 1;
          leftoverSourceDate = locked.date;
          leftoverDishId = locked.dishId;
        }
      }
      continue;
    }

    if (day.skip) {
      meals.push({
        date: day.date,
        dishId: null,
        isLeftover: false,
        locked: false,
      });
      continue;
    }

    const dishId = chromosome[i];
    if (!dishId) {
      meals.push({
        date: day.date,
        dishId: null,
        isLeftover: false,
        locked: false,
      });
      continue;
    }

    meals.push({
      date: day.date,
      dishId,
      isLeftover: false,
      locked: false,
    });

    const dish = ctx.dishMap.get(dishId);
    if (dish && dish.servesDays > 1) {
      leftoverRemaining = dish.servesDays - 1;
      leftoverSourceDate = day.date;
      leftoverDishId = dishId;
    }
  }

  return meals;
}
