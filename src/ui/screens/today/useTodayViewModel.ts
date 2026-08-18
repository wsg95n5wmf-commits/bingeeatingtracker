import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import { toLocalDate, toTimeOfDay, type LocalDate } from '@/domain/model/date';
import { phaseInfo, type PhaseInfo } from '@/domain/model/phase';
import { buildDayView, type DayView } from '@/domain/usecases/dayView';
import { nextUp, type NextUp } from '@/domain/usecases/nextUp';
import { isWeighDay } from '@/domain/usecases/weighing';
import { weekAwaitingReview, type ProgramWeek } from '@/domain/usecases/programWeek';

export type TodayState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly date: LocalDate;
      readonly phase: PhaseInfo;
      readonly day: DayView;
      readonly hasPlan: boolean;
      readonly next: NextUp | undefined;
      readonly weighDueToday: boolean;
      readonly weighedToday: boolean;
      readonly weekAwaitingReview: ProgramWeek | undefined;
    };

export function useTodayViewModel() {
  const { episodes, plans, profile, weighings, reviews } = useRepositories();
  const today = toLocalDate(new Date());

  const data = useLiveQuery(async () => {
    const currentProfile = await profile.get();
    const candidate = weekAwaitingReview(
      today,
      currentProfile.reviewDay,
      currentProfile.programStartDate,
    );
    const existingReview = candidate ? await reviews.forWeek(candidate.start) : undefined;

    return {
      profile: currentProfile,
      episodes: await episodes.forDate(today),
      plan: await plans.forDate(today),
      weighing: await weighings.forDate(today),
      awaiting: existingReview?.completedAt === undefined ? candidate : undefined,
    };
  }, [today]);

  return useMemo<{ state: TodayState }>(() => {
    if (!data) return { state: { status: 'loading' } };

    const now = toTimeOfDay(new Date());
    const day = buildDayView(data.episodes, data.plan, now);

    return {
      state: {
        status: 'ready',
        date: today,
        phase: phaseInfo(data.profile.phase),
        day,
        hasPlan: data.plan !== undefined,
        next: nextUp(day.planned, now),
        weighDueToday: isWeighDay(today, data.profile.weighDay),
        weighedToday: data.weighing !== undefined,
        weekAwaitingReview: data.awaiting,
      },
    };
  }, [data, today]);
}
