import type { LocalDate } from '@/domain/model/date';
import type { WeekSummary } from '@/domain/model/summary';
import type { SummaryRepository } from '@/domain/repositories';
import type { TrackerDatabase } from '../db/database';

export function createSummaryRepository(db: TrackerDatabase): SummaryRepository {
  return {
    async all() {
      return db.summaries.orderBy('weekNumber').toArray();
    },

    async forWeek(weekStart: LocalDate) {
      return db.summaries.get(weekStart);
    },

    async save(summary: WeekSummary) {
      await db.summaries.put(summary);
    },
  };
}
