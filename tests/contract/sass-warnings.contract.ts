/**
 * Contract: compiling the theme SCSS emits no Sass deprecation warning other
 * than the ones explicitly tolerated in `SILENCED_SASS_DEPRECATIONS`.
 *
 * Compiles `src/index.scss` with the Sass API (verbose: Sass otherwise
 * truncates repeated warnings) using the same silenced list as
 * `vite.config.ts`, and the highlight.js scoped themes the same way
 * `scripts/build-highlight-themes.ts` does. Independent of `dist/`.
 */
import * as sass from 'sass';
import {
    THEMES,
    buildScssSource,
} from '../../scripts/utils/highlight-themes.utils';
import { describe, expect, it } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SILENCED_SASS_DEPRECATIONS } from '../../scripts/utils/sass.utils';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function collect(compile: (logger: sass.Logger) => void): string[] {
    const warnings: string[] = [];
    compile({
        warn(message, options) {
            const where = options.span
                ? ` (${path.relative(ROOT, fileURLToPath(options.span.url!))}:${options.span.start.line + 1})`
                : '';
            warnings.push(
                `[${options.deprecationType?.id ?? 'warning'}] ${message.split('\n')[0]}${where}`
            );
        },
    });
    return warnings;
}

describe('sass warnings contract', () => {
    it('compiles src/index.scss without any non-tolerated warning', () => {
        const warnings = collect((logger) =>
            sass.compile(path.join(ROOT, 'src', 'index.scss'), {
                verbose: true,
                silenceDeprecations: [...SILENCED_SASS_DEPRECATIONS],
                // Vite resolves root-absolute `/node_modules/...` imports.
                importers: [
                    {
                        findFileUrl: (url) =>
                            url.startsWith('/node_modules/')
                                ? pathToFileURL(path.join(ROOT, url))
                                : null,
                    },
                ],
                logger,
            })
        );
        expect(warnings).toEqual([]);
    });

    it('compiles the scoped highlight.js themes without warning', () => {
        const warnings = collect((logger) => {
            for (const theme of THEMES) {
                sass.compileString(buildScssSource(theme, 'light'), {
                    verbose: true,
                    loadPaths: [path.join(ROOT, 'node_modules')],
                    logger,
                });
            }
        });
        expect(warnings).toEqual([]);
    });
});
