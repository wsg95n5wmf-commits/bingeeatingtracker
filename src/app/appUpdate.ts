import { registerSW } from 'virtual:pwa-register';

type Listener = (ready: boolean) => void;

const listeners = new Set<Listener>();
let updateReady = false;
let apply: (reloadPage?: boolean) => Promise<void> = async () => undefined;

/**
 * Watches for a new build and reports when one is waiting.
 *
 * The update is deliberately *not* applied on its own. Applying it reloads the
 * page, and a reload in the middle of writing a record or a weekly review would
 * throw away whatever had been typed but not yet saved. The user is told
 * instead, and chooses when to restart.
 */
export function initAppUpdate(): void {
  apply = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
      listeners.forEach((listener) => listener(true));
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;

      const check = (): void => {
        void registration.update();
      };

      // The check that matters on a phone. An installed app is suspended rather
      // than reloaded, so page load fires once and then never again for days.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });

      window.setInterval(check, 60 * 60 * 1000);
    },
  });
}

export function subscribeToUpdates(listener: Listener): () => void {
  listeners.add(listener);
  listener(updateReady);
  return () => listeners.delete(listener);
}

/** Activates the waiting build and reloads. */
export function installUpdate(): void {
  void apply(true);
}

/** Asks the browser to look for a new build now. */
export async function checkForUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker?.getRegistration();
  await registration?.update();
}
