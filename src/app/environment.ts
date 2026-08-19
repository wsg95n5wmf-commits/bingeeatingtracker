/**
 * Which build this is, and what it may touch.
 *
 * Beta and production are served from the same GitHub Pages origin, and
 * IndexedDB is scoped to the origin rather than the path. Without a distinct
 * database name a beta build would open, migrate, and write the real records.
 * The name below is the only thing keeping them apart, so do not make it
 * conditional on anything else.
 */
export type AppEnvironment = 'production' | 'beta';

export const environment: AppEnvironment =
  import.meta.env.VITE_APP_ENV === 'beta' ? 'beta' : 'production';

export const isBeta = environment === 'beta';

export const databaseName = isBeta ? 'binge-eating-tracker-beta' : 'binge-eating-tracker';

/** Shown wherever the user needs to know which build they are looking at. */
export const environmentLabel = isBeta ? 'Beta' : 'Production';
