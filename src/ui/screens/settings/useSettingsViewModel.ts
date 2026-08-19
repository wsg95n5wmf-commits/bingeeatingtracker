import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import type { Weekday } from '@/domain/model/date';
import type { Phase } from '@/domain/model/phase';
import type { Profile } from '@/domain/model/profile';
import type { HeightUnit, WeightUnit } from '@/domain/model/units';
import { backupFilename, parseBackup, BackupFormatError } from '@/domain/usecases/backup';
import { storageStatus, type StorageStatus } from '@/app/storagePersistence';

export function useSettingsViewModel() {
  const { profile, backup } = useRepositories();
  const current = useLiveQuery(() => profile.get());
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [storage, setStorage] = useState<StorageStatus>('unknown');
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void storageStatus().then(setStorage);
  }, []);

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
    const contents = await backup.export();
    const blob = new Blob([JSON.stringify(contents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFilename(new Date());
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Backup saved.');
  }, [backup]);

  const importData = useCallback(async (file: File) => {
    try {
      await backup.restore(parseBackup(JSON.parse(await file.text())));
      setMessage('Backup restored.');
    } catch (error) {
      setMessage(
        error instanceof BackupFormatError
          ? error.message
          : 'That file could not be read as a backup.',
      );
    }
  }, [backup]);

  return {
    profile: current,
    message,
    storage,
    fileInput,
    setPhase: (phase: Phase) => void update({ phase }),
    setWeighDay: (weighDay: Weekday) => void update({ weighDay }),
    setReviewDay: (reviewDay: Weekday) => void update({ reviewDay }),
    setWeightUnit: (weightUnit: WeightUnit) => void update({ weightUnit }),
    setHeightUnit: (heightUnit: HeightUnit) => void update({ heightUnit }),
    exportData,
    importData,
    eraseEverything: () => {
      // Reload so every view model drops its handle to the deleted database.
      void backup.eraseEverything().then(() => window.location.reload());
    },
  } as const;
}
