import {
    RESET_SELECTORS,
    SCOPE_SELECTOR,
    THEMES,
    buildScssSource,
    compileHighlightTheme,
    highlightFileName,
    writeHighlightThemes,
} from './highlight-themes.utils';
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Splits compiled CSS (expanded style) into its top-level selector groups
 * (the comma-separated parts of every rule's prelude), ignoring at-rules
 * (`@media`, …) and comment-only blocks.
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

describe('THEMES', () => {
    it('has exactly 15 entries, no duplicates', () => {
        expect(THEMES.length).toBe(15);
        expect(new Set(THEMES).size).toBe(THEMES.length);
    });

    it('only references themes that exist in highlight.js/scss', () => {
        for (const theme of THEMES) {
            const scssPath = path.resolve(
                'node_modules',
                'highlight.js',
                'scss',
                `${theme}.scss`
            );
            expect(fs.existsSync(scssPath), `missing ${scssPath}`).toBe(true);
        }
    });
});

describe(highlightFileName.name, () => {
    it('names a file "<theme>.<scope>.css"', () => {
        expect(highlightFileName('atom-one-light', 'light')).toBe(
            'atom-one-light.light.css'
        );
        expect(highlightFileName('atom-one-dark', 'dark')).toBe(
            'atom-one-dark.dark.css'
        );
    });
});

describe(buildScssSource.name, () => {
    it('wraps the light scope under .with-code', () => {
        const source = buildScssSource('atom-one-light', 'light');
        expect(source).toContain(`${SCOPE_SELECTOR.light} {`);
        expect(source).toContain(
            "@include meta.load-css('highlight.js/scss/atom-one-light');"
        );
    });

    it('wraps the dark scope under .with-code-dark, .with-code-bg-dark', () => {
        const source = buildScssSource('atom-one-dark', 'dark');
        expect(source).toContain(`${SCOPE_SELECTOR.dark} {`);
        expect(source).toContain(
            "@include meta.load-css('highlight.js/scss/atom-one-dark');"
        );
    });

    it('resets font-weight/font-style on the hardened selectors before loading the theme', () => {
        const source = buildScssSource('atom-one-light', 'light');
        const resetIndex = source.indexOf(RESET_SELECTORS[0]);
        const includeIndex = source.indexOf('@include meta.load-css');
        expect(resetIndex).toBeGreaterThanOrEqual(0);
        expect(resetIndex).toBeLessThan(includeIndex);
    });
});

describe(compileHighlightTheme.name, () => {
    it('scopes every selector of the light stylesheet under .with-code', () => {
        const css = compileHighlightTheme('atom-one-light', 'light');
        const selectors = extractSelectors(css);
        expect(selectors.length).toBeGreaterThan(5);
        for (const selector of selectors) {
            expect(
                selector === '.with-code' || selector.startsWith('.with-code '),
                `unexpected unscoped selector: "${selector}"`
            ).toBe(true);
        }
    });

    it('scopes every selector of the dark stylesheet under .with-code-dark/.with-code-bg-dark', () => {
        const css = compileHighlightTheme('atom-one-dark', 'dark');
        const selectors = extractSelectors(css);
        expect(selectors.length).toBeGreaterThan(5);
        for (const selector of selectors) {
            expect(
                selector.startsWith('.with-code-dark') ||
                    selector.startsWith('.with-code-bg-dark'),
                `unexpected unscoped selector: "${selector}"`
            ).toBe(true);
        }
    });

    it.each(THEMES)(
        '%s: every selector stays scoped, for every configured theme',
        (theme) => {
            const light = extractSelectors(
                compileHighlightTheme(theme, 'light')
            );
            expect(light.length).toBeGreaterThan(0);
            for (const selector of light) {
                expect(
                    selector === '.with-code' ||
                        selector.startsWith('.with-code '),
                    `unexpected unscoped selector in ${theme} (light): "${selector}"`
                ).toBe(true);
            }

            const dark = extractSelectors(compileHighlightTheme(theme, 'dark'));
            expect(dark.length).toBeGreaterThan(0);
            for (const selector of dark) {
                expect(
                    selector.startsWith('.with-code-dark') ||
                        selector.startsWith('.with-code-bg-dark'),
                    `unexpected unscoped selector in ${theme} (dark): "${selector}"`
                ).toBe(true);
            }
        }
    );

    it('never emits @layer', () => {
        for (const theme of THEMES) {
            expect(compileHighlightTheme(theme, 'light')).not.toContain(
                '@layer'
            );
            expect(compileHighlightTheme(theme, 'dark')).not.toContain(
                '@layer'
            );
        }
    });

    it('resets .hljs-keyword/.hljs-selector-tag to font-weight: normal, unconditionally', () => {
        // atom-one-light/atom-one-dark ship no `-ms-high-contrast` query of
        // their own: the only font-weight declaration on these selectors
        // must be our reset.
        const light = compileHighlightTheme('atom-one-light', 'light');
        expect(light).not.toContain('-ms-high-contrast');
        expect(light).toContain(
            `${resetHeader('light')} {\n  font-weight: normal;\n  font-style: normal;\n}`
        );

        const dark = compileHighlightTheme('atom-one-dark', 'dark');
        expect(dark).not.toContain('-ms-high-contrast');
        expect(dark).toContain(
            `${resetHeader('dark')} {\n  font-weight: normal;\n  font-style: normal;\n}`
        );
    });

    it('compiles every configured theme/scope pair without throwing', () => {
        for (const theme of THEMES) {
            expect(() => compileHighlightTheme(theme, 'light')).not.toThrow();
            expect(() => compileHighlightTheme(theme, 'dark')).not.toThrow();
        }
    });
});

describe(writeHighlightThemes.name, () => {
    let tmpDir: string;

    afterEach(() => {
        if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('writes one <theme>.light.css and one <theme>.dark.css per theme', () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-highlight-themes-'));
        writeHighlightThemes(tmpDir, ['atom-one-light', 'atom-one-dark']);

        const files = fs.readdirSync(tmpDir).sort();
        expect(files).toEqual([
            'atom-one-dark.dark.css',
            'atom-one-dark.light.css',
            'atom-one-light.dark.css',
            'atom-one-light.light.css',
        ]);
    });
});
