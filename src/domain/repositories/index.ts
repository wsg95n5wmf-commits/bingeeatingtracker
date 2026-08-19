import type { LocalDate } from '../model/date';
import type { Episode, EpisodeDraft } from '../model/episode';
import type { EpisodeId, ReviewId, TemplateId } from '../model/ids';
import type { DayPlan, PlanTemplate } from '../model/plan';
import type { Profile } from '../model/profile';
import type { ReviewSession } from '../model/review';
import type { WeekSummary } from '../model/summary';
import type { Weighing } from '../model/weighing';
import type { Backup } from '../usecases/backup';

export interface EpisodeRepository {
  forDate(date: LocalDate): Promise<Episode[]>;
  inRange(from: LocalDate, to: LocalDate): Promise<Episode[]>;
  add(draft: EpisodeDraft): Promise<EpisodeId>;
  update(id: EpisodeId, changes: Partial<EpisodeDraft>): Promise<void>;
  remove(id: EpisodeId): Promise<void>;
}

export interface PlanRepository {
  forDate(date: LocalDate): Promise<DayPlan | undefined>;
  save(plan: DayPlan): Promise<void>;
  templates(): Promise<PlanTemplate[]>;
  saveTemplate(template: PlanTemplate): Promise<void>;
  removeTemplate(id: TemplateId): Promise<void>;
}

export interface WeighingRepository {
  all(): Promise<Weighing[]>;
  forDate(date: LocalDate): Promise<Weighing | undefined>;
  inRange(from: LocalDate, to: LocalDate): Promise<Weighing[]>;
  save(weighing: Weighing): Promise<void>;
  remove(date: LocalDate): Promise<void>;
}

export interface ProfileRepository {
  get(): Promise<Profile>;
  save(changes: Partial<Profile>): Promise<void>;
  /**
   * Writes the defaults on first run, so the program start date is fixed at
   * the moment the app is first opened rather than drifting to "today".
   * Called once at startup; `get` stays a pure read.
   */
  ensure(): Promise<void>;
}

export interface ReviewRepository {
  byId(id: ReviewId): Promise<ReviewSession | undefined>;
  forWeek(weekStart: LocalDate): Promise<ReviewSession | undefined>;
  all(): Promise<ReviewSession[]>;
  latestCompleted(kind: ReviewSession['kind']): Promise<ReviewSession | undefined>;
  save(session: ReviewSession): Promise<void>;
}

export interface SummaryRepository {
  all(): Promise<WeekSummary[]>;
  forWeek(weekStart: LocalDate): Promise<WeekSummary | undefined>;
  save(summary: WeekSummary): Promise<void>;
}

export interface BackupRepository {
  /** Everything on this device, in one serialisable object. */
  export(): Promise<Backup>;
  /** Replaces everything. Atomic: a failure leaves the existing records intact. */
  restore(backup: Backup): Promise<void>;
  /** Deletes every record. Irreversible. */
  eraseEverything(): Promise<void>;
}

/** Everything the use cases need, wired at the composition root. */
export interface Repositories {
  readonly episodes: EpisodeRepository;
  readonly plans: PlanRepository;
  readonly weighings: WeighingRepository;
  readonly profile: ProfileRepository;
  readonly reviews: ReviewRepository;
  readonly summaries: SummaryRepository;
  readonly backup: BackupRepository;
}
