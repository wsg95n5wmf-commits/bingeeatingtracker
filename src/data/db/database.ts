import Dexie, { type EntityTable } from 'dexie';
import type { Episode } from '@/domain/model/episode';
import type { DayPlan, PlanTemplate } from '@/domain/model/plan';
import type { Profile } from '@/domain/model/profile';
import type { ReviewSession } from '@/domain/model/review';
import type { WeekSummary } from '@/domain/model/summary';
import type { Weighing } from '@/domain/model/weighing';

/** The profile is a single row; this is its fixed key. */
export const PROFILE_KEY = 'profile' as const;

export interface StoredProfile extends Profile {
  readonly key: typeof PROFILE_KEY;
}

export class TrackerDatabase extends Dexie {
  declare episodes: EntityTable<Episode, 'id'>;
  declare plans: EntityTable<DayPlan, 'date'>;
  declare templates: EntityTable<PlanTemplate, 'id'>;
  declare weighings: EntityTable<Weighing, 'date'>;
  declare reviews: EntityTable<ReviewSession, 'id'>;
  declare summaries: EntityTable<WeekSummary, 'weekStart'>;
  declare profile: EntityTable<StoredProfile, 'key'>;

  constructor(name = 'binge-eating-tracker') {
    super(name);
    this.version(1).stores({
      episodes: 'id, date, [date+time]',
      plans: 'date',
      templates: 'id',
      weighings: 'date',
      reviews: 'id, weekStart, kind, [kind+weekStart]',
      summaries: 'weekStart, weekNumber',
      profile: 'key',
    });
  }
}

export const db = new TrackerDatabase();
