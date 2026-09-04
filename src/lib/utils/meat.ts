import type { MeatType } from '../../types/dish';

/**
 * ICS calendar SUMMARY lines are plain text, so they can't carry a rendered
 * icon — this is the one place emoji are still appropriate. On-screen UI
 * uses `MeatIcon` (Lucide) instead.
 */
export const MEAT_EMOJI: Record<MeatType, string> = {
  beef: '🐄',
  pork: '🐷',
  poultry: '🐔',
  fish: '🐟',
  none: '🥦',
};
