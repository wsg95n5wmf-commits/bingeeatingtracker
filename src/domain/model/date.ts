import type { Branded } from './brand';

/** A calendar date with no time or zone, as `YYYY-MM-DD`. */
export type LocalDate = Branded<string, 'LocalDate'>;

/** A wall-clock time of day, as `HH:MM` in 24-hour form. */
export type TimeOfDay = Branded<string, 'TimeOfDay'>;

/** An instant, as an epoch-millisecond count. Used for `loggedAt` audit stamps. */
export type Instant = Branded<number, 'Instant'>;

/** 0 = Sunday, matching `Date.prototype.getDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_NAMES: readonly string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isLocalDate(value: string): value is LocalDate {
  return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

export function localDate(value: string): LocalDate {
  if (!isLocalDate(value)) throw new RangeError(`Not a calendar date: ${value}`);
  return value;
}

export function isTimeOfDay(value: string): value is TimeOfDay {
  return TIME_PATTERN.test(value);
}

export function timeOfDay(value: string): TimeOfDay {
  if (!isTimeOfDay(value)) throw new RangeError(`Not a time of day: ${value}`);
  return value;
}

export function instant(epochMillis: number): Instant {
  return epochMillis as Instant;
}

/**
 * The calendar date of `at` in the *local* zone.
 *
 * Deliberately not `toISOString()`, which converts to UTC and so reports the
 * wrong day for anyone logging late in the evening west of Greenwich.
 */
export function toLocalDate(at: Date): LocalDate {
  const year = String(at.getFullYear()).padStart(4, '0');
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as LocalDate;
}

export function toTimeOfDay(at: Date): TimeOfDay {
  const hours = String(at.getHours()).padStart(2, '0');
  const minutes = String(at.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}` as TimeOfDay;
}

/** Midday avoids the DST edges that bite at midnight. */
function asDate(date: LocalDate): Date {
  return new Date(`${date}T12:00:00`);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const shifted = asDate(date);
  shifted.setDate(shifted.getDate() + days);
  return toLocalDate(shifted);
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  const millis = asDate(to).getTime() - asDate(from).getTime();
  return Math.round(millis / 86_400_000);
}

export function weekdayOf(date: LocalDate): Weekday {
  return asDate(date).getDay() as Weekday;
}

export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Minutes since midnight, for ordering and gap arithmetic. */
export function minutesOfDay(time: TimeOfDay): number {
  const hours = Number(time.slice(0, 2));
  const minutes = Number(time.slice(3, 5));
  return hours * 60 + minutes;
}

export function compareTimes(a: TimeOfDay, b: TimeOfDay): number {
  return minutesOfDay(a) - minutesOfDay(b);
}

/** The most recent `weekday` on or before `date`. */
export function mostRecentWeekdayOnOrBefore(date: LocalDate, weekday: Weekday): LocalDate {
  const delta = (weekdayOf(date) - weekday + 7) % 7;
  return addDays(date, -delta);
}

/** The next `weekday` strictly after `date`. */
export function nextWeekdayAfter(date: LocalDate, weekday: Weekday): LocalDate {
  const delta = (weekday - weekdayOf(date) + 6) % 7 + 1;
  return addDays(date, delta);
}

export function formatDateLong(date: LocalDate): string {
  return asDate(date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateShort(date: LocalDate): string {
  return asDate(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
