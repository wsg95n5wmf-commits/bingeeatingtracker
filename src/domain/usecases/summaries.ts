import type { Episode } from '../model/episode';
import type { Phase } from '../model/phase';
import type { ReviewSession } from '../model/review';
import type { WeekSummary } from '../model/summary';
import type { Weighing } from '../model/weighing';
import { compensatoryCounts } from './dayView';
import type { ProgramWeek } from './programWeek';

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** The summary row is written from the user's review answers, not from the records. */
export function summaryFromReview(session: ReviewSession, weekNumber: number): WeekSummary {
  const answers = session.dayAnswers;
  return {
    weekNumber,
    weekStart: session.weekStart,
    weekEnd: session.weekEnd,
    binges: sum(answers.map((answer) => answer.bingeCount)),
    vomits: sum(answers.map((answer) => answer.vomits)),
    laxatives: sum(answers.map((answer) => answer.laxatives)),
    diuretics: sum(answers.map((answer) => answer.diuretics)),
    changeDays: answers.filter((answer) => answer.wasChangeDay).length,
    ...(session.weightGrams === undefined ? {} : { weightGrams: session.weightGrams }),
    notes: session.weekNote,
    phase: session.phase,
    reviewed: true,
  };
}

/**
 * A placeholder row for a week whose review was missed, so the trend has no
 * holes. Binges and change days are left undefined: both are the user's to
 * judge, and inventing them would put a number in the user's mouth.
 */
export function provisionalSummary(
  week: ProgramWeek,
  episodes: readonly Episode[],
  weighing: Weighing | undefined,
  phase: Phase,
): WeekSummary {
  const counts = compensatoryCounts(episodes);
  return {
    weekNumber: week.weekNumber,
    weekStart: week.start,
    weekEnd: week.end,
    vomits: counts.vomits,
    laxatives: counts.laxatives,
    diuretics: counts.diuretics,
    ...(weighing ? { weightGrams: weighing.weightGrams } : {}),
    notes: '',
    phase,
    reviewed: false,
  };
}
