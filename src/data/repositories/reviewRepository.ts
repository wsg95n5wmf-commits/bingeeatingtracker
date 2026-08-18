import type { LocalDate } from '@/domain/model/date';
import type { ReviewId } from '@/domain/model/ids';
import type { ReviewKind, ReviewSession } from '@/domain/model/review';
import type { ReviewRepository } from '@/domain/repositories';
import type { TrackerDatabase } from '../db/database';

export function createReviewRepository(db: TrackerDatabase): ReviewRepository {
  return {
    async byId(id: ReviewId) {
      return db.reviews.get(id);
    },

    async forWeek(weekStart: LocalDate) {
      return db.reviews.where('[kind+weekStart]').equals(['weekly', weekStart]).first();
    },

    async all() {
      return db.reviews.orderBy('weekStart').toArray();
    },

    async latestCompleted(kind: ReviewKind) {
      const sessions = await db.reviews.where('kind').equals(kind).toArray();
      return sessions
        .filter((session) => session.completedAt !== undefined)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];
    },

    async save(session: ReviewSession) {
      await db.reviews.put(session);
    },
  };
}
