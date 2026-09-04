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
  /**
   * Accessible name for the icon, e.g. t(`meat.${meat}`). Pass this whenever
   * the icon is the *only* signal of meat type (no adjacent visible text) —
   * omitting it renders the icon aria-hidden, which is correct only when a
   * sibling text node already names the meat type.
   */
  label?: string;
}

/** Renders inline; inherits color from its container via currentColor. */
export function MeatIcon({ meat, size = 15, label }: Props) {
  const Icon = MEAT_ICON[meat];
  if (label) return <Icon size={size} role="img" aria-label={label} />;
  return <Icon size={size} aria-hidden="true" />;
}
