import { minutesOfDay, type TimeOfDay } from '../model/date';
import type { PlannedItemView } from './dayView';

export interface NextUp {
  readonly item: PlannedItemView;
  readonly minutesAway: number;
  readonly overdue: boolean;
}

/**
 * The next planned meal or snack, so the user always knows what is coming.
 * Returns nothing once the day's plan is finished or was never made.
 */
export function nextUp(planned: readonly PlannedItemView[], now: TimeOfDay): NextUp | undefined {
  const remaining = planned
    .filter((view) => view.status !== 'eaten')
    .sort((a, b) => minutesOfDay(a.item.time) - minutesOfDay(b.item.time));

  const upcoming = remaining.find((view) => minutesOfDay(view.item.time) >= minutesOfDay(now));
  const target = upcoming ?? remaining[0];
  if (!target) return undefined;

  const minutesAway = minutesOfDay(target.item.time) - minutesOfDay(now);
  return { item: target, minutesAway: Math.abs(minutesAway), overdue: minutesAway < 0 };
}

export function formatCountdown(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
