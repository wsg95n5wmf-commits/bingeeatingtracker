import type { LocalDate } from './date';
import type { Grams } from './units';

export interface Weighing {
  readonly date: LocalDate;
  readonly weightGrams: Grams;
  /** True when recorded away from the chosen weigh day. Excluded from the trend. */
  readonly offSchedule: boolean;
}
