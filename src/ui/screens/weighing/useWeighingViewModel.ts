import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import { WEEKDAY_NAMES, toLocalDate, type LocalDate, type Weekday } from '@/domain/model/date';
import { weightToGrams, type WeightUnit } from '@/domain/model/units';
import { buildTrend, isWeighDay, type WeightTrend } from '@/domain/usecases/weighing';
import type { Weighing } from '@/domain/model/weighing';

export type WeighingState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly today: LocalDate;
      readonly unit: WeightUnit;
      readonly weighDay: Weekday;
      readonly weighDayName: string;
      readonly isWeighDayToday: boolean;
      readonly alreadyWeighedToday: boolean;
      readonly trend: WeightTrend;
      readonly offSchedule: readonly Weighing[];
    };

export function useWeighingViewModel() {
  const { profile, weighings } = useRepositories();
  const [entry, setEntry] = useState('');
  const today = toLocalDate(new Date());

  const data = useLiveQuery(async () => ({
    profile: await profile.get(),
    all: await weighings.all(),
    todays: await weighings.forDate(today),
  }), [today]);

  const state: WeighingState = useMemo(() => {
    if (!data) return { status: 'loading' };
    return {
      status: 'ready',
      today,
      unit: data.profile.weightUnit,
      weighDay: data.profile.weighDay,
      weighDayName: WEEKDAY_NAMES[data.profile.weighDay] ?? '',
      isWeighDayToday: isWeighDay(today, data.profile.weighDay),
      alreadyWeighedToday: data.todays !== undefined,
      trend: buildTrend(data.all),
      offSchedule: data.all.filter((weighing) => weighing.offSchedule),
    };
  }, [data, today]);

  /**
   * A reading taken away from the chosen day is still recorded, but marked
   * off-schedule so it stays out of the trend.
   */
  const record = useCallback(async () => {
    if (!data) return;
    const value = Number(entry);
    if (!Number.isFinite(value) || value <= 0) return;
    await weighings.save({
      date: today,
      weightGrams: weightToGrams(value, data.profile.weightUnit),
      offSchedule: !isWeighDay(today, data.profile.weighDay),
    });
    setEntry('');
  }, [data, entry, today, weighings]);

  return { state, entry, setEntry, record } as const;
}
