import { describe, expect, it } from 'vitest';
import type { TimeOfDay } from '../../model/date';
import type { PlannedItemId } from '../../model/ids';
import type { PlannedItemView } from '../dayView';
import { formatCountdown, nextUp } from '../nextUp';

function view(id: string, time: string, status: PlannedItemView['status'] = 'pending'): PlannedItemView {
  return {
    item: { id: id as PlannedItemId, kind: 'meal', label: id, time: time as TimeOfDay },
    status,
  };
}

describe('what is next', () => {
  const plan = [view('breakfast', '08:00'), view('lunch', '12:30'), view('dinner', '19:00')];

  it('names the next item and how far away it is', () => {
    const next = nextUp(plan, '10:00' as TimeOfDay);
    expect(next?.item.item.id).toBe('lunch');
    expect(next?.minutesAway).toBe(150);
    expect(next?.overdue).toBe(false);
  });

  it('skips items already eaten', () => {
    const eaten = [view('breakfast', '08:00', 'eaten'), view('lunch', '12:30', 'eaten'), view('dinner', '19:00')];
    expect(nextUp(eaten, '13:00' as TimeOfDay)?.item.item.id).toBe('dinner');
  });

  it('reports an item as overdue once its time has passed', () => {
    const next = nextUp([view('lunch', '12:30')], '13:15' as TimeOfDay);
    expect(next?.overdue).toBe(true);
    expect(next?.minutesAway).toBe(45);
  });

  it('returns nothing once every item is eaten', () => {
    expect(nextUp([view('dinner', '19:00', 'eaten')], '20:00' as TimeOfDay)).toBeUndefined();
  });

  it('returns nothing when no plan was made', () => {
    expect(nextUp([], '10:00' as TimeOfDay)).toBeUndefined();
  });

  it('formats the countdown', () => {
    expect(formatCountdown(45)).toBe('45 min');
    expect(formatCountdown(120)).toBe('2 h');
    expect(formatCountdown(150)).toBe('2 h 30 min');
  });
});
