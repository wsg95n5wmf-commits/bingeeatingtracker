import type { LocalDate, TimeOfDay, Instant } from './date';
import type { PlannedItemId, TemplateId } from './ids';

export type PlannedItemKind = 'meal' | 'snack';

export interface PlannedItem {
  readonly id: PlannedItemId;
  readonly kind: PlannedItemKind;
  readonly label: string;
  readonly time: TimeOfDay;
}

/** Whether the day was planned in advance, which the program asks for. */
export type PlanTiming = 'evening-before' | 'morning-of' | 'during-the-day';

export interface DayPlan {
  readonly date: LocalDate;
  readonly items: readonly PlannedItem[];
  readonly createdAt: Instant;
  readonly timing: PlanTiming;
  readonly notes: string;
}

export interface PlanTemplate {
  readonly id: TemplateId;
  readonly name: string;
  readonly items: readonly Omit<PlannedItem, 'id'>[];
}

/**
 * The program's example day, offered as a starting point the user edits.
 * Times are a template, not a prescription.
 */
export const DEFAULT_TEMPLATE_ITEMS: readonly Omit<PlannedItem, 'id'>[] = [
  { kind: 'meal', label: 'Breakfast', time: '08:00' as TimeOfDay },
  { kind: 'snack', label: 'Midmorning snack', time: '10:30' as TimeOfDay },
  { kind: 'meal', label: 'Lunch', time: '12:30' as TimeOfDay },
  { kind: 'snack', label: 'Midafternoon snack', time: '15:30' as TimeOfDay },
  { kind: 'meal', label: 'Evening meal', time: '19:00' as TimeOfDay },
  { kind: 'snack', label: 'Evening snack', time: '21:00' as TimeOfDay },
];
