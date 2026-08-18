import type { LocalDate } from './date';
import type { Grams } from './units';
import type { Phase } from './phase';

/** One row of the summary sheet. Written by the weekly review, not by the app. */
export interface WeekSummary {
  readonly weekNumber: number;
  readonly weekStart: LocalDate;
  readonly weekEnd: LocalDate;
  /**
   * Counted by the user at the weekly review. Undefined on a provisional row,
   * because the app cannot derive it and will not guess.
   */
  readonly binges?: number;
  readonly vomits: number;
  readonly laxatives: number;
  readonly diuretics: number;
  /** Also user-assessed, so also undefined on a provisional row. */
  readonly changeDays?: number;
  readonly weightGrams?: Grams;
  readonly notes: string;
  readonly phase: Phase;
  /**
   * False when the row was filled in from records because a weekly review was
   * missed, so the trend has no holes. Such rows are marked in the UI.
   */
  readonly reviewed: boolean;
}

/** The program suggests moving on after a week of six or seven change days. */
export const CHANGE_DAYS_TO_ADVANCE = 6;
