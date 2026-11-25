import type { DeprecationOrId } from 'sass';

/**
 * Sass deprecations knowingly tolerated while compiling the theme.
 *
 * Shared by `vite.config.ts` and `tests/contract/sass-warnings.contract.ts`
 * so that the contract checks exactly what the build silences: anything
 * else must be fixed, not listed here.
 *
 * TODO(#70): remove `import` once `@import` is migrated to `@use`.
 */
export const SILENCED_SASS_DEPRECATIONS: DeprecationOrId[] = ['import'];
