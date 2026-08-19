import type { Repositories } from '@/domain/repositories';
import type { TrackerDatabase } from '../db/database';
import { createBackupRepository } from './backupRepository';
import { createEpisodeRepository } from './episodeRepository';
import { createPlanRepository } from './planRepository';
import { createProfileRepository } from './profileRepository';
import { createReviewRepository } from './reviewRepository';
import { createSummaryRepository } from './summaryRepository';
import { createWeighingRepository } from './weighingRepository';

export function createRepositories(db: TrackerDatabase): Repositories {
  return {
    episodes: createEpisodeRepository(db),
    plans: createPlanRepository(db),
    weighings: createWeighingRepository(db),
    profile: createProfileRepository(db),
    reviews: createReviewRepository(db),
    summaries: createSummaryRepository(db),
    backup: createBackupRepository(db),
  };
}
