import { describe, expect, it } from 'vitest';
import { localDate } from '../../model/date';
import type { Grams } from '../../model/units';
import type { Weighing } from '../../model/weighing';
import { buildTrend, isWeighDay } from '../weighing';

function weighing(date: string, kilos: number, offSchedule = false): Weighing {
  return { date: localDate(date), weightGrams: (kilos * 1000) as Grams, offSchedule };
}

describe('weekly weighing', () => {
  it('recognises the chosen weigh day', () => {
    expect(isWeighDay(localDate('2026-08-19'), 3 /* Wednesday */)).toBe(true);
    expect(isWeighDay(localDate('2026-08-20'), 3)).toBe(false);
  });

  it('keeps off-schedule readings out of the trend', () => {
    const trend = buildTrend([
      weighing('2026-08-05', 72),
      weighing('2026-08-07', 71.2, true),
      weighing('2026-08-12', 72.3),
    ]);
    expect(trend.points).toHaveLength(2);
    expect(trend.points.map((point) => point.date)).toEqual(['2026-08-05', '2026-08-12']);
  });

  it('will not call the line readable until there are four readings', () => {
    const three = [weighing('2026-08-05', 72), weighing('2026-08-12', 72.4), weighing('2026-08-19', 71.9)];
    expect(buildTrend(three).readable).toBe(false);
    expect(buildTrend([...three, weighing('2026-08-26', 72.1)]).readable).toBe(true);
  });

  it('sorts readings by date', () => {
    const trend = buildTrend([weighing('2026-08-19', 71.9), weighing('2026-08-05', 72)]);
    expect(trend.points[0]?.date).toBe('2026-08-05');
  });

  it('handles having no readings at all', () => {
    const trend = buildTrend([]);
    expect(trend.points).toHaveLength(0);
    expect(trend.readable).toBe(false);
  });
});
