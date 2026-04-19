export interface DayModifier {
  date: string;
  wifeDuty?: boolean;
  skip?: boolean;
  requiresTags?: string[];
  difficultyCap?: number;
  note?: string;
}
