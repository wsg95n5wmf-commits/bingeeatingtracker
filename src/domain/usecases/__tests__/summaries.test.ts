import { describe, expect, it } from 'vitest';
import type { Instant, LocalDate } from '../../model/date';
import type { ReviewId } from '../../model/ids';
import type { DayReviewAnswer, ReviewSession } from '../../model/review';
import type { Grams } from '../../model/units';
import { provisionalSummary, summaryFromReview } from '../summaries';
import { advancementAdvice } from '../advancement';
import { weekContaining } from '../programWeek';
import { localDate } from '../../model/date';

function answer(date: string, overrides: Partial<DayReviewAnswer> = {}): DayReviewAnswer {
  return {
    date: date as LocalDate,
    monitoredAccurately: true,
    bingeCount: 0,
    vomits: 0,
    laxatives: 0,
    diuretics: 0,
    wasChangeDay: true,
    note: '',
    ...overrides,
  };
}

function session(dayAnswers: DayReviewAnswer[], overrides: Partial<ReviewSession> = {}): ReviewSession {
  return {
    id: 'r1' as ReviewId,
    kind: 'weekly',
    phase: 'step-2',
    weekStart: '2026-08-18' as LocalDate,
    weekEnd: '2026-08-24' as LocalDate,
    startedAt: 0 as Instant,
    dayAnswers,
    answers: {},
    weekNote: '',
    ...overrides,
  };
}

describe('the summary row', () => {
  it('totals the counts the user gave, not the records', () => {
    const summary = summaryFromReview(
      session([
        answer('2026-08-18', { bingeCount: 2, vomits: 1 }),
        answer('2026-08-19', { bingeCount: 1 }),
        answer('2026-08-20', { vomits: 1, laxatives: 2 }),
      ]),
      3,
    );
    expect(summary.binges).toBe(3);
    expect(summary.vomits).toBe(2);
    expect(summary.laxatives).toBe(2);
    expect(summary.reviewed).toBe(true);
  });

  it('counts change days from the user’s own judgement', () => {
    const summary = summaryFromReview(
      session([
        answer('2026-08-18', { wasChangeDay: true }),
        answer('2026-08-19', { wasChangeDay: false }),
        answer('2026-08-20', { wasChangeDay: true }),
      ]),
      1,
    );
    expect(summary.changeDays).toBe(2);
  });

  it('carries the weight through when one was recorded', () => {
    const summary = summaryFromReview(session([], { weightGrams: 72_400 as Grams }), 1);
    expect(summary.weightGrams).toBe(72_400);
  });
});

describe('a provisional row for a missed review', () => {
  const week = weekContaining(localDate('2026-08-20'), 2, localDate('2026-08-04'));

  it('leaves binges undefined rather than guessing', () => {
    const summary = provisionalSummary(week, [], undefined, 'step-2');
    expect(summary.binges).toBeUndefined();
    expect(summary.changeDays).toBeUndefined();
    expect(summary.reviewed).toBe(false);
  });
});

describe('advancement advice', () => {
  it('says nothing when the week was never reviewed', () => {
    const summary = provisionalSummary(
      weekContaining(localDate('2026-08-20'), 2, localDate('2026-08-04')),
      [],
      undefined,
      'step-2',
    );
    expect(advancementAdvice(summary)).toBeUndefined();
  });

  it('reports enough change days at six', () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      answer(`2026-08-${18 + index}`, { wasChangeDay: index < 6 }),
    );
    const advice = advancementAdvice(summaryFromReview(session(days), 1));
    expect(advice).toEqual({ changeDays: 6, enough: true });
  });

  it('reports not enough at five', () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      answer(`2026-08-${18 + index}`, { wasChangeDay: index < 5 }),
    );
    expect(advancementAdvice(summaryFromReview(session(days), 1))?.enough).toBe(false);
  });
});
