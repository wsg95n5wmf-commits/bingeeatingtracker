import { toLocalDate, type TimeOfDay } from '@/domain/model/date';
import type { Profile } from '@/domain/model/profile';
import type { ProfileRepository } from '@/domain/repositories';
import { PROFILE_KEY, type TrackerDatabase } from '../db/database';

/** The user starts at Step 2 and adjusts everything from Settings. */
export function defaultProfile(today = new Date()): Profile {
  return {
    phase: 'step-2',
    programStartDate: toLocalDate(today),
    weighDay: 3,
    weighTime: '07:30' as TimeOfDay,
    reviewDay: 0,
    reviewTime: '19:00' as TimeOfDay,
    weightUnit: 'kg',
    heightUnit: 'cm',
  };
}

export function createProfileRepository(db: TrackerDatabase): ProfileRepository {
  return {
    /**
     * A pure read. The defaults are returned rather than written, so this stays
     * safe to call from a live query, which runs in a read-only transaction.
     * The first `save` is what persists them.
     */
    async get() {
      const stored = await db.profile.get(PROFILE_KEY);
      if (!stored) return defaultProfile();
      const { key: _key, ...profile } = stored;
      return profile;
    },

    async ensure() {
      const stored = await db.profile.get(PROFILE_KEY);
      if (!stored) {
        await db.profile.put({ ...defaultProfile(), key: PROFILE_KEY });
      }
    },

    async save(changes: Partial<Profile>) {
      const current = await this.get();
      await db.profile.put({ ...current, ...changes, key: PROFILE_KEY });
    },
  };
}
