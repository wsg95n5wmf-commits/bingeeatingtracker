import type { LocalDate, Instant } from './date';
import type { ReviewId } from './ids';
import type { Grams } from './units';
import type { Phase } from './phase';

export type ReviewKind = 'check-in' | 'weekly';
export type ReviewDecision = 'stay' | 'advance';

/**
 * The user's answers for one day of the weekly walkthrough.
 *
 * `bingeCount` is the user's own count, read off the chains of asterisks in
 * their record. The app never derives it — see SPEC.md §3.
 */
export interface DayReviewAnswer {
  readonly date: LocalDate;
  readonly monitoredAccurately: boolean;
  readonly bingeCount: number;
  readonly vomits: number;
  readonly laxatives: number;
  readonly diuretics: number;
  readonly wasChangeDay: boolean;
  readonly note: string;
}

/** What the app counted, revealed only after the user commits their answer. */
export interface DayComputedCounts {
  readonly vomits: number;
  readonly laxatives: number;
  readonly diuretics: number;
}

export interface ReviewSession {
  readonly id: ReviewId;
  readonly kind: ReviewKind;
  readonly phase: Phase;
  readonly weekStart: LocalDate;
  readonly weekEnd: LocalDate;
  readonly startedAt: Instant;
  readonly completedAt?: Instant;
  readonly dayAnswers: readonly DayReviewAnswer[];
  /** Free-text answers to the pattern and phase questions, keyed by question id. */
  readonly answers: Readonly<Record<string, string>>;
  readonly weightGrams?: Grams;
  readonly weekNote: string;
  readonly decision?: ReviewDecision;
}

export interface ReviewQuestion {
  readonly id: string;
  readonly prompt: string;
}

/**
 * Prompts that structure the user's own reflection. These are questions to fill
 * in, not teaching — the reasoning behind them is in the book.
 */
export const PATTERN_QUESTIONS: readonly ReviewQuestion[] = [
  { id: 'binges-in-common', prompt: 'Did the binges this week have anything in common?' },
  { id: 'binge-timing', prompt: 'When did they happen? Any pattern to the time or day?' },
  { id: 'binge-triggers', prompt: 'What triggered them?' },
  { id: 'binge-foods', prompt: 'What did you eat in them? Foods you avoid at other times?' },
  { id: 'outside-binges', prompt: 'What were you eating outside the binges? Restricting, delaying, or avoiding anything?' },
  { id: 'days-differ', prompt: 'Were all your days alike, or did they differ?' },
];

export const CHECK_IN_QUESTIONS: readonly ReviewQuestion[] = [
  { id: 'monitoring', prompt: 'Have you been monitoring?' },
  { id: 'monitoring-better', prompt: 'Can you improve your monitoring?' },
  { id: 'weighing', prompt: 'Are you weighing yourself once a week?' },
  { id: 'patterns', prompt: 'Are any patterns becoming evident?' },
];

export const STEP_2_QUESTIONS: readonly ReviewQuestion[] = [
  { id: 'planning', prompt: 'Are you planning your meals and snacks in advance?' },
  { id: 'eating-planned', prompt: 'Are you eating them?' },
  { id: 'gaps', prompt: 'Are you eating in the gaps between them?' },
];

export function phaseQuestions(phase: Phase): readonly ReviewQuestion[] {
  return phase === 'step-2' ? STEP_2_QUESTIONS : [];
}
