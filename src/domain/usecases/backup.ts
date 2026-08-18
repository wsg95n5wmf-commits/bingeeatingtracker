import type { Episode } from '../model/episode';
import type { DayPlan, PlanTemplate } from '../model/plan';
import type { Profile } from '../model/profile';
import type { ReviewSession } from '../model/review';
import type { WeekSummary } from '../model/summary';
import type { Weighing } from '../model/weighing';

export const BACKUP_VERSION = 1;

export interface Backup {
  readonly version: number;
  readonly exportedAt: string;
  readonly profile: Profile;
  readonly episodes: readonly Episode[];
  readonly plans: readonly DayPlan[];
  readonly templates: readonly PlanTemplate[];
  readonly weighings: readonly Weighing[];
  readonly reviews: readonly ReviewSession[];
  readonly summaries: readonly WeekSummary[];
}

export class BackupFormatError extends Error {}

/**
 * Validates the shape of a parsed backup. Kept strict: importing replaces
 * everything, so a malformed file must fail before any data is touched.
 */
export function parseBackup(raw: unknown): Backup {
  if (typeof raw !== 'object' || raw === null) {
    throw new BackupFormatError('That file does not contain a backup.');
  }

  const candidate = raw as Partial<Backup>;
  if (candidate.version !== BACKUP_VERSION) {
    throw new BackupFormatError(
      `Backup version ${String(candidate.version)} cannot be read by this version of the app.`,
    );
  }

  const collections = ['episodes', 'plans', 'templates', 'weighings', 'reviews', 'summaries'] as const;
  for (const key of collections) {
    if (!Array.isArray(candidate[key])) {
      throw new BackupFormatError(`The backup is missing its "${key}".`);
    }
  }
  if (typeof candidate.profile !== 'object' || candidate.profile === null) {
    throw new BackupFormatError('The backup is missing its settings.');
  }

  return candidate as Backup;
}

export function backupFilename(now: Date): string {
  const stamp = now.toISOString().slice(0, 10);
  return `tracker-backup-${stamp}.export.json`;
}
