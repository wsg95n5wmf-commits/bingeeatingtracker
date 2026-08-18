import { describe, expect, it } from 'vitest';
import type { PlannedItem, PlannedItemKind } from '../../model/plan';
import type { PlannedItemId } from '../../model/ids';
import type { TimeOfDay } from '../../model/date';
import { breachingGaps, formatGap, gapsIn } from '../planGaps';

function item(id: string, time: string, kind: PlannedItemKind = 'meal'): PlannedItem {
  return { id: id as PlannedItemId, kind, label: id, time: time as TimeOfDay };
}

describe('the four-hour rule', () => {
  it('accepts a plan with no gap over four hours', () => {
    const plan = [item('b', '08:00'), item('l', '12:00'), item('s', '15:30'), item('d', '19:00')];
    expect(breachingGaps(plan)).toHaveLength(0);
  });

  it('flags a gap longer than four hours', () => {
    const plan = [item('l', '12:00'), item('d', '19:00')];
    const breaches = breachingGaps(plan);
    expect(breaches).toHaveLength(1);
    expect(breaches[0]?.minutes).toBe(420);
  });

  it('accepts a gap of exactly four hours', () => {
    expect(breachingGaps([item('l', '12:00'), item('d', '16:00')])).toHaveLength(0);
  });

  it('permits the morning exception when breakfast runs straight to lunch', () => {
    const plan = [item('b', '07:00'), item('l', '12:30'), item('s', '15:30'), item('d', '19:00')];
    const [first] = gapsIn(plan);
    expect(first?.tooLong).toBe(true);
    expect(first?.morningException).toBe(true);
    expect(breachingGaps(plan)).toHaveLength(0);
  });

  it('does not extend the morning exception to an afternoon gap', () => {
    const plan = [item('b', '08:00'), item('l', '12:00'), item('d', '19:00')];
    expect(breachingGaps(plan)).toHaveLength(1);
    expect(breachingGaps(plan)[0]?.beforeItemId).toBe('d');
  });

  it('does not treat a late first gap as the morning exception', () => {
    const plan = [item('l', '12:00'), item('d', '18:00')];
    expect(gapsIn(plan)[0]?.morningException).toBe(false);
  });

  it('orders items by time regardless of entry order', () => {
    const plan = [item('d', '19:00'), item('b', '08:00'), item('l', '12:00')];
    expect(gapsIn(plan).map((gap) => gap.beforeItemId)).toEqual(['l', 'd']);
  });

  it('reports no gaps for a plan with a single item', () => {
    expect(gapsIn([item('b', '08:00')])).toHaveLength(0);
    expect(gapsIn([])).toHaveLength(0);
  });

  it('formats gaps readably', () => {
    expect(formatGap(45)).toBe('45 min');
    expect(formatGap(240)).toBe('4 h');
    expect(formatGap(285)).toBe('4 h 45 min');
  });
});
