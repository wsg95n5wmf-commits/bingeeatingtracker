import type { LocalDate, Instant } from '@/domain/model/date';
import type { EpisodeDraft } from '@/domain/model/episode';
import type { EpisodeId } from '@/domain/model/ids';
import type { EpisodeRepository } from '@/domain/repositories';
import type { TrackerDatabase } from '../db/database';

export function createEpisodeRepository(db: TrackerDatabase): EpisodeRepository {
  return {
    async forDate(date: LocalDate) {
      return db.episodes.where('date').equals(date).toArray();
    },

    async inRange(from: LocalDate, to: LocalDate) {
      return db.episodes.where('date').between(from, to, true, true).toArray();
    },

    async add(draft: EpisodeDraft) {
      const id = crypto.randomUUID() as EpisodeId;
      // loggedAt is stamped here, not by the caller, so it always reflects the
      // moment the row was actually written.
      await db.episodes.add({ ...draft, id, loggedAt: Date.now() as Instant });
      return id;
    },

    async update(id: EpisodeId, changes: Partial<EpisodeDraft>) {
      await db.episodes.update(id, changes);
    },

    async remove(id: EpisodeId) {
      await db.episodes.delete(id);
    },
  };
}
