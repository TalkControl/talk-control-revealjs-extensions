import { defineConfig } from 'vitest/config';

/**
 * Contract tests: characterization snapshots of the behaviour we ship.
 *
 * - `src/**\/*.contract.ts` run the real markdown pipeline (no mocks) on a
 *   corpus of Markdown fixtures.
 * - `tests/contract/**\/*.contract.ts` inspect the built package in `dist/`,
 *   so they must run after `npm run build`.
 *
 * Snapshots are files (`.html`, `.css`, `.json`, `.d.ts`) so that their diff
 * is reviewable in a pull request. In CI (`CI=true`), Vitest never writes a
 * snapshot: a missing or different snapshot fails the run.
 */
export default defineConfig({
    test: {
        include: ['src/**/*.contract.ts', 'tests/contract/**/*.contract.ts'],
        testTimeout: 120_000,
        hookTimeout: 120_000,
        environmentOptions: {
            jsdom: {
                // Not a `file:` URL: its opaque origin makes `localStorage`
                // throw, which Vitest's jsdom environment trips over.
                // Markdown files are served by the corpus XHR stub instead
                // (see `render-corpus.ts`).
                url: 'http://localhost/',
            },
        },
    },
});
