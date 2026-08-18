import { weekdayOf, type LocalDate, type Weekday } from '../model/date';
import type { Grams } from '../model/units';
import type { Weighing } from '../model/weighing';

/**
 * The program asks for several readings before any conclusion is drawn, because
 * a single reading reflects hydration as much as anything else.
 */
export const READINGS_BEFORE_A_TREND = 4;

export interface TrendPoint {
  readonly date: LocalDate;
  readonly weightGrams: Grams;
}

export interface WeightTrend {
  readonly points: readonly TrendPoint[];
  /** False until there are enough readings for the shape of the line to mean anything. */
  readonly readable: boolean;
  readonly minGrams: Grams;
  readonly maxGrams: Grams;
}

export function isWeighDay(date: LocalDate, weighDay: Weekday): boolean {
  return weekdayOf(date) === weighDay;
}

/** Off-schedule readings are recorded but never plotted. */
export function buildTrend(weighings: readonly Weighing[]): WeightTrend {
  const points = weighings
    .filter((weighing) => !weighing.offSchedule)
    .map((weighing) => ({ date: weighing.date, weightGrams: weighing.weightGrams }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const values = points.map((point) => point.weightGrams);
  return {
    points,
    readable: points.length >= READINGS_BEFORE_A_TREND,
    minGrams: (values.length > 0 ? Math.min(...values) : 0) as Grams,
    maxGrams: (values.length > 0 ? Math.max(...values) : 0) as Grams,
  };
}
