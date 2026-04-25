export interface DayModifier {
  date: string;
  skip?: boolean;
  requiresTags?: string[];
  difficultyCap?: number;
  note?: string;
}

export interface CumulativeLimit {
  id: string;
  startDate: string; // YYYY-MM-DD inclusive
  endDate: string;   // YYYY-MM-DD inclusive
  maxTotal: number;  // max sum of dish.difficulty for non-leftover meals
}
