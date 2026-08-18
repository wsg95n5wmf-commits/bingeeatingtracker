import { daysBetween, type LocalDate } from '../model/date';
import type { ReviewSession } from '../model/review';
import { CHANGE_DAYS_TO_ADVANCE, type WeekSummary } from '../model/summary';

/** Check-in reviews fall every three to four days between weekly reviews. */
export const CHECK_IN_INTERVAL_DAYS = 4;

export interface AdvancementAdvice {
  readonly changeDays: number;
  readonly enough: boolean;
}

/**
 * Reports what the user's own change-day count implies. The decision to move on
 * is always the user's — nothing here changes the phase.
 */
export function advancementAdvice(summary: WeekSummary): AdvancementAdvice | undefined {
  if (summary.changeDays === undefined) return undefined;
  return {
    changeDays: summary.changeDays,
    enough: summary.changeDays >= CHANGE_DAYS_TO_ADVANCE,
  };
}

export function checkInDue(
  today: LocalDate,
  lastCheckIn: ReviewSession | undefined,
  programStart: LocalDate,
): boolean {
  const since = lastCheckIn?.completedAt
    ? daysBetween(lastCheckIn.weekStart, today)
    : daysBetween(programStart, today);
  return since >= CHECK_IN_INTERVAL_DAYS;
}
