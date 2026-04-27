// Build-time metadata exposed to components.
//
// The `__COMMIT_HASH__` and `__BUILD_TIME__` symbols are substituted by
// Vite at build time (see `vite.define` in astro.config.mjs). They are
// not real runtime variables — by the time this module ships, the
// references are already replaced with string literals.

declare const __COMMIT_HASH__: string;
declare const __BUILD_TIME__: string;

export const commitHash: string = __COMMIT_HASH__;
export const buildTime: string = __BUILD_TIME__;
export const repoUrl = 'https://github.com/mountain-heritage-trust/mountain-heritage-org';
