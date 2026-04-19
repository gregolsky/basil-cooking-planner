export interface TagDefinition {
  id: string;
  name: string;
  maxPerWeek?: number;
  minGapDays?: number;
  color?: string;
  description?: string;
}
