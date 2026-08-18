import { useCallback, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import { db } from '@/data/db/database';
import { eraseEverything, exportBackup, importBackup } from '@/data/backupService';
import type { Weekday } from '@/domain/model/date';
import type { Phase } from '@/domain/model/phase';
import type { Profile } from '@/domain/model/profile';
import type { HeightUnit, WeightUnit } from '@/domain/model/units';
import { backupFilename, parseBackup, BackupFormatError } from '@/domain/usecases/backup';

export function useSettingsViewModel() {
  const { profile } = useRepositories();
  const current = useLiveQuery(() => profile.get());
  const [message, setMessage] = useState<string | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const update = useCallback(
    async (changes: Partial<Profile>) => {
      await profile.save(changes);
    },
    [profile],
  );

  /**
   * Writes the backup to a file the user chooses. Everything stays on the
   * device — nothing is uploaded anywhere.
   */
  const exportData = useCallback(async () => {
    const backup = await exportBackup(db);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFilename(new Date());
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Backup saved.');
  }, []);

  const importData = useCallback(async (file: File) => {
    try {
      const backup = parseBackup(JSON.parse(await file.text()));
      await importBackup(db, backup);
      setMessage('Backup restored.');
    } catch (error) {
      setMessage(
        error instanceof BackupFormatError
          ? error.message
          : 'That file could not be read as a backup.',
      );
    }
  }, []);

  return {
    profile: current,
    message,
    fileInput,
    setPhase: (phase: Phase) => void update({ phase }),
    setWeighDay: (weighDay: Weekday) => void update({ weighDay }),
    setReviewDay: (reviewDay: Weekday) => void update({ reviewDay }),
    setWeightUnit: (weightUnit: WeightUnit) => void update({ weightUnit }),
    setHeightUnit: (heightUnit: HeightUnit) => void update({ heightUnit }),
    exportData,
    importData,
    eraseEverything: () => void eraseEverything(db),
  } as const;
}
