/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** 'beta' for the beta build; absent or anything else means production. */
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** ISO timestamp of the build, injected by Vite. */
declare const __BUILD_TIME__: string;
