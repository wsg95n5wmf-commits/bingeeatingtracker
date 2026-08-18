import type { LocalDate, TimeOfDay, Weekday } from './date';
import type { Phase } from './phase';
import type { Centimetres, HeightUnit, WeightUnit } from './units';

export interface Profile {
  readonly phase: Phase;
  readonly programStartDate: LocalDate;
  readonly weighDay: Weekday;
  readonly weighTime: TimeOfDay;
  /** The program week runs from review day to review day. */
  readonly reviewDay: Weekday;
  readonly reviewTime: TimeOfDay;
  readonly weightUnit: WeightUnit;
  readonly heightUnit: HeightUnit;
  readonly heightCm?: Centimetres;
}
