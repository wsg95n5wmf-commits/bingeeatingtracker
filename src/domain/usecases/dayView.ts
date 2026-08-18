import { compareTimes, minutesOfDay, type TimeOfDay } from '../model/date';
import { hasCompensatoryBehaviour, isRealTime, type Episode } from '../model/episode';
import type { DayPlan, PlannedItem } from '../model/plan';

export type PlannedItemStatus = 'eaten' | 'pending' | 'missed';

export interface PlannedItemView {
  readonly item: PlannedItem;
  readonly status: PlannedItemStatus;
  readonly episode?: Episode;
}

export interface EpisodeView {
  readonly episode: Episode;
  /**
   * Position within a run of consecutive excessive episodes, so the record can
   * render chains of asterisks the way they read on paper.
   *
   * This is presentation of the user's own marks. The app asserts no binge
   * count — the user counts the chains at the weekly review.
   */
  readonly chain?: { readonly index: number; readonly length: number };
  /** True when the episode falls outside every planned meal and snack. */
  readonly inGap: boolean;
}

export interface DayView {
  readonly episodes: readonly EpisodeView[];
  readonly planned: readonly PlannedItemView[];
  readonly realTimeCount: number;
  readonly loggedLateCount: number;
}

/**
 * Group consecutive excessive episodes into runs.
 *
 * A run is broken by any non-excessive eating episode, exactly as a chain of
 * asterisks is broken on the paper record. No time threshold is applied,
 * because the program defines none.
 */
function markChains(episodes: readonly Episode[]): Map<string, { index: number; length: number }> {
  const chains = new Map<string, { index: number; length: number }>();
  let run: Episode[] = [];

  const flush = (): void => {
    if (run.length > 0) {
      run.forEach((episode, index) => chains.set(episode.id, { index, length: run.length }));
      run = [];
    }
  };

  for (const episode of episodes) {
    if (episode.excessive) run.push(episode);
    else flush();
  }
  flush();

  return chains;
}

function statusFor(
  item: PlannedItem,
  episode: Episode | undefined,
  now: TimeOfDay | undefined,
): PlannedItemStatus {
  if (episode) return 'eaten';
  if (now && minutesOfDay(now) > minutesOfDay(item.time) + 90) return 'missed';
  return 'pending';
}

export function buildDayView(
  episodes: readonly Episode[],
  plan: DayPlan | undefined,
  now?: TimeOfDay,
): DayView {
  const ordered = [...episodes].sort((a, b) => compareTimes(a.time, b.time));
  const chains = markChains(ordered);

  const planned: PlannedItemView[] = (plan?.items ?? []).map((item) => {
    const episode = ordered.find((candidate) => candidate.plannedItemId === item.id);
    return {
      item,
      status: statusFor(item, episode, now),
      ...(episode ? { episode } : {}),
    };
  });

  const episodeViews: EpisodeView[] = ordered.map((episode) => {
    const chain = chains.get(episode.id);
    return {
      episode,
      ...(chain ? { chain } : {}),
      inGap: episode.plannedItemId === undefined,
    };
  });

  return {
    episodes: episodeViews,
    planned: planned.sort((a, b) => compareTimes(a.item.time, b.item.time)),
    realTimeCount: ordered.filter(isRealTime).length,
    loggedLateCount: ordered.filter((episode) => !isRealTime(episode)).length,
  };
}

/** Exact counts the app can derive, because these are explicit per-episode flags. */
export function compensatoryCounts(episodes: readonly Episode[]): {
  vomits: number;
  laxatives: number;
  diuretics: number;
} {
  return {
    vomits: episodes.filter((episode) => episode.vomited).length,
    laxatives: episodes.filter((episode) => episode.laxatives).length,
    diuretics: episodes.filter((episode) => episode.diuretics).length,
  };
}

export function anyCompensatory(episodes: readonly Episode[]): boolean {
  return episodes.some(hasCompensatoryBehaviour);
}
