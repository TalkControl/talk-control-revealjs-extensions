import * as path from 'node:path';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Freezes the *shape* of the accessibility `@media` guards introduced for
 * issue #107: the theme honors `prefers-reduced-motion`, `forced-colors` and
 * `prefers-contrast`, purely through additive `@media` blocks (no default
 * rendering change, no `@layer` wrapper so a later cascade-layer rollout -
 * #35 - can slot them in without conflict).
 *
 * This does not assert the rendered effect (no layout/media-emulation engine
 * runs here) - that is covered by the Playwright scenario in
 * `e2e/reduced-motion.spec.ts`.
 */
function compileMotionContrastCss(): string {
    const scssPath = path.resolve(__dirname, 'motion-contrast.scss');
    return sass.compile(scssPath).css;
}

/**
 * Extracts the body of a top-level `@media <query> { ... }` block, matching
 * braces so nested rules (e.g. `.reveal { code { ... } }`) don't truncate
 * the extraction early.
 */
function extractMediaBlock(css: string, query: string): string {
    const needle = `@media ${query}`;
    const start = css.indexOf(needle);
    if (start === -1) {
        throw new Error(`Could not find media query "${query}" in: \n${css}`);
    }
    const braceStart = css.indexOf('{', start);
    let depth = 0;
    let i = braceStart;
    for (; i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}') {
            depth--;
            if (depth === 0) break;
        }
    }
    return css.slice(braceStart + 1, i);
}

describe('a11y/motion-contrast.scss (issue #107)', () => {
    const css = compileMotionContrastCss();

    it('never wraps its rules in an @layer (stays layer-agnostic for #35)', () => {
        expect(css).not.toMatch(/@layer/);
    });

    describe('prefers-reduced-motion: reduce', () => {
        const block = extractMediaBlock(
            css,
            '(prefers-reduced-motion: reduce)'
        );

        it('forces transitions to a zero duration', () => {
            expect(block).toMatch(/transition-duration:\s*0s\s*!important/);
        });

        it('forces animations to a zero duration and a single iteration', () => {
            expect(block).toMatch(/animation-duration:\s*0s\s*!important/);
            expect(block).toMatch(
                /animation-iteration-count:\s*1\s*!important/
            );
        });

        it('disables smooth scrolling', () => {
            expect(block).toMatch(/scroll-behavior:\s*auto\s*!important/);
        });

        it('targets every element and pseudo-element generically, not named theme selectors', () => {
            // Generic (`*`, `*::before`, `*::after`) rather than naming
            // e.g. `.tc-copy-to-clipboard` directly, so it also covers any
            // transition/animation added later by this theme.
            expect(block).toMatch(/\*/);
            expect(block).not.toMatch(/tc-copy-to-clipboard/);
        });
    });

    describe('forced-colors: active', () => {
        const block = extractMediaBlock(css, '(forced-colors: active)');

        it('gives box-shadow-only elements a system-color border fallback', () => {
            expect(block).toMatch(/border:\s*1px solid CanvasText/);
        });
    });

    describe('prefers-contrast: more', () => {
        const block = extractMediaBlock(css, '(prefers-contrast: more)');

        it('strengthens borders without waiting for forced-colors mode', () => {
            expect(block).toMatch(/border/);
        });
    });
});
