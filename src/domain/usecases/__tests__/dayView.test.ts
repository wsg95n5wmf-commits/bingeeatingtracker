import { describe, expect, it } from 'vitest';
import type { Episode } from '../../model/episode';
import type { EpisodeId, PlannedItemId } from '../../model/ids';
import type { Instant, LocalDate, TimeOfDay } from '../../model/date';
import { buildDayView, compensatoryCounts } from '../dayView';

const DATE = '2026-08-18' as LocalDate;

function episode(id: string, time: string, overrides: Partial<Episode> = {}): Episode {
  return {
    id: id as EpisodeId,
    date: DATE,
    time: time as TimeOfDay,
    loggedAt: new Date(`${DATE}T${time}:00`).getTime() as Instant,
    description: id,
    isMeal: false,
    place: 'Kitchen',
    excessive: false,
    vomited: false,
    laxatives: false,
    diuretics: false,
    context: '',
    ...overrides,
  };
}

describe('chains of asterisks', () => {
  it('groups consecutive excessive episodes into one run', () => {
    const view = buildDayView(
      [
        episode('a', '19:00', { excessive: true }),
        episode('b', '19:30', { excessive: true }),
        episode('c', '20:00', { excessive: true }),
      ],
      undefined,
    );
    expect(view.episodes.map((entry) => entry.chain?.length)).toEqual([3, 3, 3]);
    expect(view.episodes.map((entry) => entry.chain?.index)).toEqual([0, 1, 2]);
  });

  it('breaks a run at a non-excessive episode, as the paper record does', () => {
    const view = buildDayView(
      [
        episode('a', '19:00', { excessive: true }),
        episode('b', '19:30'),
        episode('c', '20:00', { excessive: true }),
      ],
      undefined,
    );
    expect(view.episodes[0]?.chain?.length).toBe(1);
    expect(view.episodes[1]?.chain).toBeUndefined();
    expect(view.episodes[2]?.chain?.length).toBe(1);
  });

  it('does not break a run on elapsed time alone, because the program defines no threshold', () => {
    const view = buildDayView(
      [
        episode('a', '09:00', { excessive: true }),
        episode('b', '21:00', { excessive: true }),
      ],
      undefined,
    );
    expect(view.episodes[0]?.chain?.length).toBe(2);
  });

  it('orders episodes by time whatever order they were entered in', () => {
    const view = buildDayView([episode('late', '21:00'), episode('early', '08:00')], undefined);
    expect(view.episodes.map((entry) => entry.episode.id)).toEqual(['early', 'late']);
  });
});

describe('real-time logging', () => {
  it('counts a row written at the time as real time', () => {
    const view = buildDayView([episode('a', '12:00')], undefined);
    expect(view.realTimeCount).toBe(1);
    expect(view.loggedLateCount).toBe(0);
  });

  it('counts a row written hours later as late', () => {
    const late = episode('a', '12:00', {
      loggedAt: new Date(`${DATE}T17:00:00`).getTime() as Instant,
    });
    const view = buildDayView([late], undefined);
    expect(view.realTimeCount).toBe(0);
    expect(view.loggedLateCount).toBe(1);
  });
});

describe('compensatory counts', () => {
  it('counts each behaviour separately', () => {
    const counts = compensatoryCounts([
      episode('a', '12:00', { vomited: true }),
      episode('b', '13:00', { vomited: true, laxatives: true }),
      episode('c', '14:00', { diuretics: true }),
    ]);
    expect(counts).toEqual({ vomits: 2, laxatives: 1, diuretics: 1 });
  });
});

describe('planned items', () => {
  it('marks a planned item eaten once an episode is linked to it', () => {
    const plannedId = 'lunch' as PlannedItemId;
    const view = buildDayView(
      [episode('a', '12:30', { plannedItemId: plannedId })],
      {
        date: DATE,
        items: [{ id: plannedId, kind: 'meal', label: 'Lunch', time: '12:30' as TimeOfDay }],
        createdAt: 0 as Instant,
        timing: 'morning-of',
        notes: '',
      },
    );
    expect(view.planned[0]?.status).toBe('eaten');
    expect(view.episodes[0]?.inGap).toBe(false);
  });

  it('marks an episode outside the plan as eaten in a gap', () => {
    const view = buildDayView([episode('a', '16:00')], {
      date: DATE,
      items: [{ id: 'lunch' as PlannedItemId, kind: 'meal', label: 'Lunch', time: '12:30' as TimeOfDay }],
      createdAt: 0 as Instant,
      timing: 'morning-of',
      notes: '',
    });
    expect(view.episodes[0]?.inGap).toBe(true);
  });
});
