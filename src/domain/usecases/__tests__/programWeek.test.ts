import { describe, expect, it } from 'vitest';
import { addDays, localDate } from '../../model/date';
import { datesOf, isWeekComplete, weekAwaitingReview, weekContaining } from '../programWeek';

// 2026-08-18 is a Tuesday.
const START = localDate('2026-08-04');

describe('the program week', () => {
  it('runs from review day to review day', () => {
    const week = weekContaining(localDate('2026-08-20'), 2 /* Tuesday */, START);
    expect(week.start).toBe('2026-08-18');
    expect(week.end).toBe('2026-08-24');
  });

  it('covers exactly the seven days the review walks through', () => {
    const week = weekContaining(localDate('2026-08-20'), 2, START);
    const days = datesOf(week);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-08-18');
    expect(days[6]).toBe('2026-08-24');
  });

  it('treats the review day itself as the first day of the new week', () => {
    const week = weekContaining(localDate('2026-08-18'), 2, START);
    expect(week.start).toBe('2026-08-18');
  });

  it('numbers weeks from the program start', () => {
    expect(weekContaining(localDate('2026-08-05'), 2, START).weekNumber).toBe(1);
    expect(weekContaining(localDate('2026-08-11'), 2, START).weekNumber).toBe(2);
    expect(weekContaining(localDate('2026-08-18'), 2, START).weekNumber).toBe(3);
  });

  it('moves the boundary when the user picks a different review day', () => {
    const sunday = weekContaining(localDate('2026-08-20'), 0, START);
    expect(sunday.start).toBe('2026-08-16');
    expect(sunday.end).toBe('2026-08-22');
  });

  it('does not offer a week for review until its last day has passed', () => {
    const week = weekContaining(localDate('2026-08-20'), 2, START);
    expect(isWeekComplete(week, localDate('2026-08-24'))).toBe(false);
    expect(isWeekComplete(week, localDate('2026-08-25'))).toBe(true);
  });

  it('crosses a daylight-saving boundary without losing a day', () => {
    // Europe/Oslo and US zones shift clocks in late October.
    const week = weekContaining(localDate('2026-10-28'), 3 /* Wednesday */, localDate('2026-10-07'));
    expect(datesOf(week)).toHaveLength(7);
    expect(week.start).toBe('2026-10-28');
    expect(week.end).toBe('2026-11-03');
  });
});

describe('which week is waiting to be reviewed', () => {
  it('offers nothing during the first week of the program', () => {
    // Program starts Tuesday; reviews fall on Sunday. Nothing to review yet.
    expect(weekAwaitingReview(localDate('2026-08-18'), 0, localDate('2026-08-18'))).toBeUndefined();
  });

  it('offers nothing on the very first day', () => {
    expect(weekAwaitingReview(localDate('2026-08-04'), 2, localDate('2026-08-04'))).toBeUndefined();
  });

  it('offers the first week once it has finished', () => {
    const week = weekAwaitingReview(localDate('2026-08-25'), 2, localDate('2026-08-18'));
    expect(week?.weekNumber).toBe(1);
    expect(week?.start).toBe('2026-08-18');
  });

  it('offers the week just finished, not the one running', () => {
    const week = weekAwaitingReview(localDate('2026-09-03'), 2, localDate('2026-08-18'));
    expect(week?.weekNumber).toBe(2);
    expect(week?.start).toBe('2026-08-25');
  });

  it('never returns a week numbered below one', () => {
    for (let offset = 0; offset < 14; offset += 1) {
      const today = addDays(localDate('2026-08-18'), offset);
      const week = weekAwaitingReview(today, 0, localDate('2026-08-18'));
      if (week) expect(week.weekNumber).toBeGreaterThanOrEqual(1);
    }
  });
});
