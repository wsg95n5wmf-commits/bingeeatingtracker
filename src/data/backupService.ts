import { BACKUP_VERSION, type Backup } from '@/domain/usecases/backup';
import { PROFILE_KEY, type TrackerDatabase } from './db/database';
import { defaultProfile } from './repositories/profileRepository';

export async function exportBackup(db: TrackerDatabase): Promise<Backup> {
  const [stored, episodes, plans, templates, weighings, reviews, summaries] = await Promise.all([
    db.profile.get(PROFILE_KEY),
    db.episodes.toArray(),
    db.plans.toArray(),
    db.templates.toArray(),
    db.weighings.toArray(),
    db.reviews.toArray(),
    db.summaries.toArray(),
  ]);

  const profile = stored ? (({ key: _key, ...rest }) => rest)(stored) : defaultProfile();

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
    episodes,
    plans,
    templates,
    weighings,
    reviews,
    summaries,
  };
}

/**
 * Replaces everything. Run in one transaction so a failure part-way cannot
 * leave the user with half their records.
 */
export async function importBackup(db: TrackerDatabase, backup: Backup): Promise<void> {
  await db.transaction(
    'rw',
    [db.profile, db.episodes, db.plans, db.templates, db.weighings, db.reviews, db.summaries],
    async () => {
      await Promise.all([
        db.episodes.clear(),
        db.plans.clear(),
        db.templates.clear(),
        db.weighings.clear(),
        db.reviews.clear(),
        db.summaries.clear(),
        db.profile.clear(),
      ]);
      await Promise.all([
        db.profile.put({ ...backup.profile, key: PROFILE_KEY }),
        db.episodes.bulkPut([...backup.episodes]),
        db.plans.bulkPut([...backup.plans]),
        db.templates.bulkPut([...backup.templates]),
        db.weighings.bulkPut([...backup.weighings]),
        db.reviews.bulkPut([...backup.reviews]),
        db.summaries.bulkPut([...backup.summaries]),
      ]);
    },
  );
}

export async function eraseEverything(db: TrackerDatabase): Promise<void> {
  await db.delete();
  window.location.reload();
}
