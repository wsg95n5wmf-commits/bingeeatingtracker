import type { LocalDate, TimeOfDay, Instant } from './date';
import type { EpisodeId, PlannedItemId } from './ids';

/**
 * One row of the monitoring record.
 *
 * The six columns of the paper record map to: `time`, `description`, `place`,
 * `excessive`, the compensatory flags, and `context`.
 */
export interface Episode {
  readonly id: EpisodeId;
  readonly date: LocalDate;
  /** Column 1 — when the eating happened, as entered by the user. */
  readonly time: TimeOfDay;
  /** When the row was actually written. Used to show how close to real time logging is. */
  readonly loggedAt: Instant;
  /** Column 2 — a plain description. Never calories. */
  readonly description: string;
  /** Column 2 — the paper record brackets meals; snacks and other eating are unbracketed. */
  readonly isMeal: boolean;
  /** Column 3 — where, and which room if at home. */
  readonly place: string;
  /** Column 4 — felt excessive *at the time*. */
  readonly excessive: boolean;
  /** Column 5 */
  readonly vomited: boolean;
  readonly laxatives: boolean;
  readonly diuretics: boolean;
  /** Column 6 — circumstances, thoughts, feelings. */
  readonly context: string;
  readonly plannedItemId?: PlannedItemId;
}

export type EpisodeDraft = Omit<Episode, 'id' | 'loggedAt'>;

/** How far after the eating the row was written. */
export function minutesAfterTheFact(episode: Episode): number {
  const eatenAt = new Date(`${episode.date}T${episode.time}:00`).getTime();
  return Math.max(0, Math.round((episode.loggedAt - eatenAt) / 60_000));
}

/**
 * A row counts as logged in real time if it was written within 30 minutes.
 * Shown to the user as a plain count, never as a score or a streak.
 */
export const REAL_TIME_MINUTES = 30;

export function isRealTime(episode: Episode): boolean {
  return minutesAfterTheFact(episode) <= REAL_TIME_MINUTES;
}

export function hasCompensatoryBehaviour(episode: Episode): boolean {
  return episode.vomited || episode.laxatives || episode.diuretics;
}
