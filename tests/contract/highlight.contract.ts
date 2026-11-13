/**
 * Contract of the scoped highlight.js themes shipped in `dist/highlight/`
 * (issue #46), checked AFTER `npm run build`.
 */
import {
    RESET_SELECTORS,
    SCOPE_SELECTOR,
    THEMES,
} from '../../scripts/utils/highlight-themes.utils';
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const HIGHLIGHT_DIR = path.join(ROOT, 'dist', 'highlight');
const MAIN_CSS = path.join(ROOT, 'dist', 'talk-control-revealjs-theme.css');

/**
 * Splits compiled CSS into its top-level selector groups (the
 * comma-separated parts of every rule's prelude), ignoring at-rules
 * (`@media`, …) and comment-only blocks. Mirrors the parser used in
 * `scripts/utils/highlight-themes.utils.spec.ts`.
 */
function extractSelectors(css: string): string[] {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors: string[] = [];
    for (const match of withoutComments.matchAll(/([^{}]+)\{/g)) {
        const prelude = match[1].trim();
        if (!prelude || prelude.startsWith('@')) continue;
        selectors.push(
            ...prelude.split(',').map((selector) => selector.trim())
        );
    }
    return selectors;
}

/** The selector header Sass emits for the font-weight/font-style reset. */
function resetHeader(scope: 'light' | 'dark'): string {
    const scopes = SCOPE_SELECTOR[scope].split(',').map((s) => s.trim());
    return scopes
        .flatMap((scopeSelector) =>
            RESET_SELECTORS.map((selector) => `${scopeSelector} ${selector}`)
        )
        .join(', ');
}

describe('dist/highlight contract', () => {
    it('ships exactly one <theme>.light.css and one <theme>.dark.css per configured theme', () => {
        if (!fs.existsSync(HIGHLIGHT_DIR)) {
            throw new Error(
                'dist/highlight/ is missing: run `npm run build` before `npm run test:contract`.'
            );
        }
        const expected = THEMES.flatMap((theme) => [
            `${theme}.dark.css`,
            `${theme}.light.css`,
        ]).sort();
        expect(fs.readdirSync(HIGHLIGHT_DIR).sort()).toEqual(expected);
    });

    it.each(THEMES)(
        '%s: the light stylesheet only contains selectors scoped under .with-code',
        (theme) => {
            const css = fs.readFileSync(
                path.join(HIGHLIGHT_DIR, `${theme}.light.css`),
                'utf8'
            );
            for (const selector of extractSelectors(css)) {
                expect(
                    selector === '.with-code' ||
                        selector.startsWith('.with-code '),
                    `unexpected unscoped selector in ${theme}.light.css: "${selector}"`
                ).toBe(true);
            }
        }
    );

    it.each(THEMES)(
        '%s: the dark stylesheet only contains selectors scoped under .with-code-dark/.with-code-bg-dark',
        (theme) => {
            const css = fs.readFileSync(
                path.join(HIGHLIGHT_DIR, `${theme}.dark.css`),
                'utf8'
            );
            for (const selector of extractSelectors(css)) {
                expect(
                    selector.startsWith('.with-code-dark') ||
                        selector.startsWith('.with-code-bg-dark'),
                    `unexpected unscoped selector in ${theme}.dark.css: "${selector}"`
                ).toBe(true);
            }
        }
    );

    it.each(THEMES)('%s: no stylesheet contains @layer', (theme) => {
        for (const scope of ['light', 'dark'] as const) {
            const css = fs.readFileSync(
                path.join(HIGHLIGHT_DIR, `${theme}.${scope}.css`),
                'utf8'
            );
            expect(css).not.toContain('@layer');
        }
    });

    it.each(THEMES)(
        '%s: resets font-weight/font-style on .hljs-keyword and .hljs-selector-tag',
        (theme) => {
            for (const scope of ['light', 'dark'] as const) {
                const css = fs.readFileSync(
                    path.join(HIGHLIGHT_DIR, `${theme}.${scope}.css`),
                    'utf8'
                );
                expect(css).toContain(
                    `${resetHeader(scope)} {\n  font-weight: normal;\n  font-style: normal;\n}`
                );
            }
        }
    );

    it('leaves dist/talk-control-revealjs-theme.css byte-for-byte unchanged (non-negotiable: see #46 plan)', () => {
        // Characterization guard: shipping dist/highlight/ must not alter a
        // single byte of the main compiled theme. The checksum below was
        // taken from a clean `npm run build` on `upstream/main` before this
        // feature existed (see the PR description for the exact command).
        const css = fs.readFileSync(MAIN_CSS);
        const hash = createHash('sha256').update(css).digest('hex');
        expect(hash).toBe(
            '682087fa2569c65bd2ff4d663716f6b2b1f874acf44af034dcf0e6b98ad48f75'
        );
    });
});
