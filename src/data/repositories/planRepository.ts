import type { LocalDate } from '@/domain/model/date';
import type { TemplateId } from '@/domain/model/ids';
import type { DayPlan, PlanTemplate } from '@/domain/model/plan';
import type { PlanRepository } from '@/domain/repositories';
import type { TrackerDatabase } from '../db/database';

export function createPlanRepository(db: TrackerDatabase): PlanRepository {
  return {
    async forDate(date: LocalDate) {
      return db.plans.get(date);
    },

    async save(plan: DayPlan) {
      await db.plans.put(plan);
    },

    async templates() {
      return db.templates.toArray();
    },

    async saveTemplate(template: PlanTemplate) {
      await db.templates.put(template);
    },

    async removeTemplate(id: TemplateId) {
      await db.templates.delete(id);
    },
  };
}
