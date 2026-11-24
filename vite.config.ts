import { PROJECT_ROOT } from './scripts/utils/dir.utils';
import { SILENCED_SASS_DEPRECATIONS } from './scripts/utils/sass.utils';
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'node:path';

// Rolldown no longer polyfills `import.meta.url` in UMD output (it becomes
// `undefined`). `tc-vendor-loader` resolves `dist/vendor/` from it, so a
// build-only `define` routes it through a variable declared per format by
// these `intro`s.
const IMPORT_META_URL_VAR = '__tc_import_meta_url__';
const ES_INTRO = `var ${IMPORT_META_URL_VAR} = import.meta.url;`;
// Same polyfill Rollup used to emit for UMD (script src, then document base,
// then Node's `__filename`).
const UMD_INTRO =
    "var _tcCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;" +
    `var ${IMPORT_META_URL_VAR} = (typeof document === 'undefined' && typeof location === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : typeof document === 'undefined' ? location.href : (_tcCurrentScript && _tcCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _tcCurrentScript.src || new URL('talk-control-revealjs-extensions.umd.cjs', document.baseURI).href));`;

export default defineConfig({
    test: {
        // Playwright e2e specs live in e2e/ and are run via `npm run e2e`,
        // not Vitest.
        exclude: [...configDefaults.exclude, 'e2e/**'],
    },
    css: {
        preprocessorOptions: {
            scss: {
                // TODO(#70): remove once @import is migrated to @use
                // (list shared with tests/contract/sass-warnings.contract.ts)
                silenceDeprecations: SILENCED_SASS_DEPRECATIONS,
            },
        },
    },
    build: {
        sourcemap: true,
        lib: {
            entry: path.resolve(PROJECT_ROOT, 'src', 'index.ts'),
            name: 'talk-control-revealjs-extensions',
            fileName: 'talk-control-revealjs-extensions',
            // CSS file name is a contract with downstream themes
            // (sfeir-school-theme): do not change.
            cssFileName: 'talk-control-revealjs-theme',
        },
        outDir: path.resolve(PROJECT_ROOT, 'dist'),
        rolldownOptions: {
            output: [
                { format: 'es', intro: ES_INTRO },
                {
                    format: 'umd',
                    name: 'talk-control-revealjs-extensions',
                    intro: UMD_INTRO,
                },
            ],
        },
    },
    plugins: [
        dts({ bundleTypes: true }),
        {
            // Build-only: under Vitest `__tc_import_meta_url__` has no
            // declaration, `import.meta.url` must stay native.
            name: 'tc-import-meta-url',
            apply: 'build',
            config: () => ({
                define: { 'import.meta.url': IMPORT_META_URL_VAR },
            }),
        },
    ],
});
