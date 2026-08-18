/**
 * Ask the browser to keep this origin's storage.
 *
 * Every record lives in IndexedDB on the device. Without persistence granted,
 * a browser under storage pressure may evict the database — which on a phone
 * means losing the monitoring records. Asking costs nothing; browsers grant it
 * based on their own signals (on iOS, adding to the home screen helps).
 *
 * This is best-effort and never blocks startup. Backups remain the real answer.
 */
export type StorageStatus = 'persistent' | 'best-effort' | 'unknown';

export async function requestPersistentStorage(): Promise<StorageStatus> {
  if (!navigator.storage?.persist) return 'unknown';
  try {
    const already = (await navigator.storage.persisted?.()) ?? false;
    if (already) return 'persistent';
    return (await navigator.storage.persist()) ? 'persistent' : 'best-effort';
  } catch {
    return 'unknown';
  }
}

export async function storageStatus(): Promise<StorageStatus> {
  if (!navigator.storage?.persisted) return 'unknown';
  try {
    return (await navigator.storage.persisted()) ? 'persistent' : 'best-effort';
  } catch {
    return 'unknown';
  }
}
