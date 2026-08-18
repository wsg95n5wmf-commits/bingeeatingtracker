import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import {
  toLocalDate,
  toTimeOfDay,
  type LocalDate,
  type TimeOfDay,
} from '@/domain/model/date';
import type { Episode, EpisodeDraft } from '@/domain/model/episode';
import type { EpisodeId } from '@/domain/model/ids';
import { buildDayView, type DayView } from '@/domain/usecases/dayView';

export type RecordState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly date: LocalDate;
      readonly day: DayView;
      readonly isToday: boolean;
    };

export function useRecordViewModel(date: LocalDate) {
  const { episodes, plans } = useRepositories();
  const [editing, setEditing] = useState<Episode | undefined>(undefined);
  const [composing, setComposing] = useState(false);

  const data = useLiveQuery(
    async () => ({
      episodes: await episodes.forDate(date),
      plan: await plans.forDate(date),
    }),
    [date],
  );

  const today = toLocalDate(new Date());

  const state: RecordState = useMemo(() => {
    if (!data) return { status: 'loading' };
    const isToday = date === today;
    return {
      status: 'ready',
      date,
      day: buildDayView(data.episodes, data.plan, isToday ? toTimeOfDay(new Date()) : undefined),
      isToday,
    };
  }, [data, date, today]);

  const addEpisode = useCallback(
    async (draft: EpisodeDraft) => {
      await episodes.add(draft);
      setComposing(false);
    },
    [episodes],
  );

  const updateEpisode = useCallback(
    async (id: EpisodeId, changes: Partial<EpisodeDraft>) => {
      await episodes.update(id, changes);
      setEditing(undefined);
    },
    [episodes],
  );

  const removeEpisode = useCallback(
    async (id: EpisodeId) => {
      await episodes.remove(id);
      setEditing(undefined);
    },
    [episodes],
  );

  const plannedItems = data?.plan?.items ?? [];

  return {
    state,
    editing,
    composing,
    plannedItems,
    suggestedTime: toTimeOfDay(new Date()) as TimeOfDay,
    startComposing: () => setComposing(true),
    cancelComposing: () => setComposing(false),
    startEditing: (episode: Episode) => setEditing(episode),
    cancelEditing: () => setEditing(undefined),
    addEpisode,
    updateEpisode,
    removeEpisode,
  } as const;
}
