export interface PlannedMeal {
  date: string;
  dishId: string | null;
  isLeftover: boolean;
  sourceDate?: string;
  locked: boolean;
}

export type ViolationSeverity = 'hard' | 'soft' | 'info';

export interface Violation {
  date: string;
  severity: ViolationSeverity;
  kind: string;
  message: string;
}

export interface Plan {
  id: string;
  name?: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  meals: PlannedMeal[];
  fitness: number;
  violations: Violation[];
}
