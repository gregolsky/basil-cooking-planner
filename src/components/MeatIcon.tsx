import { Beef, Ham, Drumstick, Fish, Leaf, type LucideIcon } from 'lucide-react';
import type { MeatType } from '../types/dish';

const MEAT_ICON: Record<MeatType, LucideIcon> = {
  beef: Beef,
  pork: Ham,
  poultry: Drumstick,
  fish: Fish,
  none: Leaf,
};

interface Props {
  meat: MeatType;
  size?: number;
}

/** Renders inline; inherits color from its container via currentColor. */
export function MeatIcon({ meat, size = 15 }: Props) {
  const Icon = MEAT_ICON[meat];
  return <Icon size={size} aria-hidden="true" />;
}
