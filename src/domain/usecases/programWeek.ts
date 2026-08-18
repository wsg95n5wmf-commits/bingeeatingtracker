import {
  addDays,
  daysBetween,
  mostRecentWeekdayOnOrBefore,
  type LocalDate,
  type Weekday,
} from '../model/date';

export interface ProgramWeek {
  readonly weekNumber: number;
  readonly start: LocalDate;
  /** Inclusive: the seven days the weekly review walks through. */
  readonly end: LocalDate;
}

/**
 * The program week runs from review day to review day, so the seven days a
 * review covers are exactly the days it walks through.
 */
export function weekContaining(
  date: LocalDate,
  reviewDay: Weekday,
  programStart: LocalDate,
): ProgramWeek {
  const start = mostRecentWeekdayOnOrBefore(date, reviewDay);
  const firstWeekStart = mostRecentWeekdayOnOrBefore(programStart, reviewDay);
  const weekNumber = Math.floor(daysBetween(firstWeekStart, start) / 7) + 1;
  return { weekNumber, start, end: addDays(start, 6) };
}

export function previousWeek(week: ProgramWeek): ProgramWeek {
  return {
    weekNumber: week.weekNumber - 1,
    start: addDays(week.start, -7),
    end: addDays(week.end, -7),
  };
}

export function datesOf(week: ProgramWeek): LocalDate[] {
  return Array.from({ length: 7 }, (_, offset) => addDays(week.start, offset));
}

/** A week can only be reviewed once its last day has passed. */
export function isWeekComplete(week: ProgramWeek, today: LocalDate): boolean {
  return daysBetween(week.end, today) >= 1;
}

/**
 * The most recent finished week that is actually part of the program.
 *
 * Returns nothing during the program's first week, when there is no earlier
 * week to review, so the app never offers to review "week 0".
 */
export function weekAwaitingReview(
  today: LocalDate,
  reviewDay: Weekday,
  programStart: LocalDate,
): ProgramWeek | undefined {
  const current = weekContaining(today, reviewDay, programStart);
  const candidate = isWeekComplete(current, today) ? current : previousWeek(current);
  return candidate.weekNumber >= 1 && isWeekComplete(candidate, today) ? candidate : undefined;
}
