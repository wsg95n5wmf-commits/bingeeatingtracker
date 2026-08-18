import type { LocalDate } from '@/domain/model/date';
import type { WeighingRepository } from '@/domain/repositories';
import type { Weighing } from '@/domain/model/weighing';
import type { TrackerDatabase } from '../db/database';

export function createWeighingRepository(db: TrackerDatabase): WeighingRepository {
  return {
    async all() {
      return db.weighings.orderBy('date').toArray();
    },

    async forDate(date: LocalDate) {
      return db.weighings.get(date);
    },

    async inRange(from: LocalDate, to: LocalDate) {
      return db.weighings.where('date').between(from, to, true, true).toArray();
    },

    async save(weighing: Weighing) {
      await db.weighings.put(weighing);
    },

    async remove(date: LocalDate) {
      await db.weighings.delete(date);
    },
  };
}
