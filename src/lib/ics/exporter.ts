import type { Plan } from '../../types/plan';
import type { Dish, MeatType } from '../../types/dish';
import { MEAT_EMOJI } from '../utils/meat';
import { addDays } from '../utils/date';

export interface IcsLabels {
  /** Calendar display name (X-WR-CALNAME). */
  calendarName: string;
  /** Label for the difficulty line in the event description. */
  difficulty: string;
  /** Label for the tags line in the event description. */
  tags: string;
  /** Human-readable meat type, e.g. t(`meat.${m}`). */
  meatLabel: (m: MeatType) => string;
  /** Resolves a tag ID (dish.tags entries) to its display name. */
  tagName: (id: string) => string;
}

const FOLD_LIMIT_OCTETS = 75;

/** Escapes text per RFC 5545 §3.3.11 (TEXT value type). */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Folds a single unfolded content line to <=75 octets per physical line
 * (RFC 5545 §3.1), breaking only on UTF-8 character boundaries and
 * continuing with CRLF + a single space.
 */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= FOLD_LIMIT_OCTETS) return line;

  const decoder = new TextDecoder('utf-8');
  const chunks: string[] = [];
  let start = 0;
  let limit = FOLD_LIMIT_OCTETS;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Back off while we're in the middle of a multi-byte UTF-8 sequence
    // (continuation bytes have the form 10xxxxxx, i.e. 0x80-0xBF).
    while (end < bytes.length && end > start && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    chunks.push(decoder.decode(bytes.slice(start, end)));
    start = end;
    limit = FOLD_LIMIT_OCTETS - 1; // continuation lines lose a byte to the leading space
  }
  return chunks.join('\r\n ');
}

function formatDateStamp(iso: string): string {
  return iso.replace(/-/g, '');
}

function formatUtcStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function planToIcs(plan: Plan, dishMap: Map<string, Dish>, labels: IcsLabels, now: Date = new Date()): string {
  const dtstamp = formatUtcStamp(now);

  const events = plan.meals
    .filter((m) => !m.isLeftover && m.dishId && dishMap.has(m.dishId))
    .map((m) => {
      const dish = dishMap.get(m.dishId!)!;
      const summary = `${MEAT_EMOJI[dish.meat]} ${dish.name}`;
      const descriptionLines = [labels.meatLabel(dish.meat), `${labels.difficulty}: ${dish.difficulty}`];
      if (dish.tags.length > 0) descriptionLines.push(`${labels.tags}: ${dish.tags.map(labels.tagName).join(', ')}`);

      const lines = [
        'BEGIN:VEVENT',
        `UID:${plan.id}-${m.date}@basil-cooking-planner`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${formatDateStamp(m.date)}`,
        `DTEND;VALUE=DATE:${formatDateStamp(addDays(m.date, 1))}`,
        `SUMMARY:${escapeText(summary)}`,
        `DESCRIPTION:${escapeText(descriptionLines.join('\n'))}`,
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      ];
      return lines.map(foldLine).join('\r\n');
    });

  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Basil Cooking Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(labels.calendarName)}`,
  ].map(foldLine);

  return [...header, ...events, 'END:VCALENDAR'].join('\r\n') + '\r\n';
}

export function icsFileName(plan: Plan): string {
  return `basil-${plan.startDate}-${plan.endDate}.ics`;
}
