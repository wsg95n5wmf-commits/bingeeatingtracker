import type { Backup } from '@/domain/usecases/backup';
import type { BackupRepository } from '@/domain/repositories';
import { eraseEverything, exportBackup, importBackup } from '../backupService';
import type { TrackerDatabase } from '../db/database';

export function createBackupRepository(db: TrackerDatabase): BackupRepository {
  return {
    export: () => exportBackup(db),
    restore: (backup: Backup) => importBackup(db, backup),
    eraseEverything: () => eraseEverything(db),
  };
}
