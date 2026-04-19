export type MeatType = 'beef' | 'pork' | 'poultry' | 'fish' | 'none';

export const MEAT_LABELS: Record<MeatType, string> = {
  beef: 'wołowina',
  pork: 'wieprzowina',
  poultry: 'drób',
  fish: 'ryba',
  none: 'bezmięsne',
};

export interface Dish {
  id: string;
  name: string;
  meat: MeatType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  preference: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  servesDays: 1 | 2 | 3;
}
