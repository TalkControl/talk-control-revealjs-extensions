import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CORPUS_DIR = path.resolve(
    import.meta.dirname,
    'src',
    'marked',
    '__fixtures__',
    'corpus'
);

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
                // The jsdom document lives next to the corpus, so that
                // `<section data-markdown="xxx.md">` is loaded through
                // reveal.js' own XHR, exactly like a real deck
                // (ThemeInitializer always uses external Markdown files).
                url: pathToFileURL(CORPUS_DIR + path.sep).href,
            },
        },
    },
});
