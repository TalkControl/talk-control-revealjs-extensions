import { PROJECT_ROOT } from './scripts/utils/dir.utils';
import { defineConfig } from 'vite';
import path from 'node:path';

/**
 * Second, independent Vite build: the `talk-control-a11y` CLI (Node
 * target), built to `dist/cli/`. Kept entirely separate from the main
 * `vite.config.ts` (browser library build) so neither build can disturb the
 * other. `playwright` and `@axe-core/playwright` are externalized: this CLI
 * is for internal/maintainer use only, not a published dependency surface,
 * so they're resolved from this repo's own `node_modules` at run time
 * rather than bundled.
 */
export default defineConfig({
    // This build has no use for the library build's public/ assets
    // (icons, demo images): avoid copying them into dist/cli/.
    publicDir: false,
    build: {
        emptyOutDir: false,
        sourcemap: true,
        lib: {
            entry: path.resolve(
                PROJECT_ROOT,
                'src',
                'a11y',
                'cli',
                'talk-control-a11y.ts'
            ),
            formats: ['es'],
            fileName: () => 'talk-control-a11y.js',
        },
        outDir: path.resolve(PROJECT_ROOT, 'dist', 'cli'),
        rollupOptions: {
            // prettier is externalized too (not just playwright/@axe-core):
            // bundling it breaks its dynamic parser loading at runtime.
            external: [
                'playwright',
                '@axe-core/playwright',
                'prettier',
                /^node:/,
            ],
            output: {
                banner: '#!/usr/bin/env node',
            },
        },
        target: 'node20',
    },
});
