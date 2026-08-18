import { minutesOfDay, type TimeOfDay } from '../model/date';
import type { PlannedItem } from '../model/plan';

export const MAX_GAP_MINUTES = 4 * 60;

/** The program allows a longer gap in the morning, when binges are least likely. */
const MORNING_EXCEPTION_UNTIL = 13 * 60;

export interface PlanGap {
  readonly afterItemId: PlannedItem['id'];
  readonly beforeItemId: PlannedItem['id'];
  readonly minutes: number;
  readonly tooLong: boolean;
  /** A too-long gap the program explicitly permits: the first gap of the day, ending by midday. */
  readonly morningException: boolean;
}

export function sortByTime(items: readonly PlannedItem[]): PlannedItem[] {
  return [...items].sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
}

export function gapsIn(items: readonly PlannedItem[]): PlanGap[] {
  const ordered = sortByTime(items);
  const gaps: PlanGap[] = [];

  for (let index = 1; index < ordered.length; index += 1) {
    const earlier = ordered[index - 1];
    const later = ordered[index];
    if (!earlier || !later) continue;

    const minutes = minutesOfDay(later.time) - minutesOfDay(earlier.time);
    const tooLong = minutes > MAX_GAP_MINUTES;
    gaps.push({
      afterItemId: earlier.id,
      beforeItemId: later.id,
      minutes,
      tooLong,
      morningException:
        tooLong && index === 1 && minutesOfDay(later.time) <= MORNING_EXCEPTION_UNTIL,
    });
  }

  return gaps;
}

/** Gaps that break the rule and are not the permitted morning one. */
export function breachingGaps(items: readonly PlannedItem[]): PlanGap[] {
  return gapsIn(items).filter((gap) => gap.tooLong && !gap.morningException);
}

export function formatGap(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function isBeforeAll(time: TimeOfDay, items: readonly PlannedItem[]): boolean {
  return items.every((item) => minutesOfDay(item.time) > minutesOfDay(time));
}
