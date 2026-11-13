import * as sass from 'sass';
import { PROJECT_ROOT } from './dir.utils';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Highlight.js themes shipped as scoped stylesheets in `dist/highlight/`
 * (see issue #46). Each entry must match a file name under
 * `node_modules/highlight.js/scss/<name>.scss`.
 *
 * To add a theme: add its file name below (one line). To remove one:
 * delete its line. The generated files disappear on the next `npm run
 * build`; nothing else to update (`exports` in `package.json` uses a glob,
 * see `./highlight/*`).
 */
export const THEMES = [
    'a11y-light',
    'a11y-dark',
    'atom-one-light',
    'atom-one-dark',
    'github',
    'github-dark',
    'monokai',
    'nord',
    'vs',
    'vs2015',
    'docco',
    'xcode',
    'tokyo-night-light',
    'tokyo-night-dark',
    'night-owl',
] as const;

export type HighlightTheme = (typeof THEMES)[number];

export type HighlightScope = 'light' | 'dark';

export const SCOPES: readonly HighlightScope[] = ['light', 'dark'];

/** CSS selector each scope is nested under. */
export const SCOPE_SELECTOR: Record<HighlightScope, string> = {
    light: '.with-code',
    dark: '.with-code-dark, .with-code-bg-dark',
};

/**
 * Selectors the embedded `a11y-light`/`a11y-dark` themes harden
 * (`font-weight`/`font-style`) under `@media (-ms-high-contrast: active)`
 * (see `node_modules/highlight.js/scss/a11y-*.scss`). A generated theme
 * that doesn't redeclare them would otherwise leak that bold/italic
 * styling from the embedded theme it replaces, since the cascade only
 * overrides a selector a later stylesheet actually declares.
 */
export const RESET_SELECTORS = ['.hljs-keyword', '.hljs-selector-tag'];

export function highlightFileName(
    theme: HighlightTheme,
    scope: HighlightScope
): string {
    return `${theme}.${scope}.css`;
}

/**
 * Builds the SCSS source for one theme/scope pair: the scope selector
 * wraps a `font-weight`/`font-style` reset (see `RESET_SELECTORS`) followed
 * by the theme itself, loaded with `sass:meta` so it comes out nested
 * under the scope instead of as a plain `@import`.
 */
export function buildScssSource(
    theme: HighlightTheme,
    scope: HighlightScope
): string {
    const reset = RESET_SELECTORS.join(', ');
    return `@use 'sass:meta';
${SCOPE_SELECTOR[scope]} {
    ${reset} { font-weight: normal; font-style: normal; }
    @include meta.load-css('highlight.js/scss/${theme}');
}
`;
}

/**
 * Compiles one theme/scope pair to plain CSS. `loadPaths` defaults to this
 * repo's `node_modules` (where `highlight.js/scss/*` resolves from).
 */
export function compileHighlightTheme(
    theme: HighlightTheme,
    scope: HighlightScope,
    loadPaths: string[] = [path.resolve(PROJECT_ROOT, 'node_modules')]
): string {
    const source = buildScssSource(theme, scope);
    const result = sass.compileString(source, {
        loadPaths,
        style: 'expanded',
    });
    return result.css.trimEnd() + '\n';
}

/**
 * Generates every configured theme/scope stylesheet into `outDir`
 * (created if missing). Called from `scripts/build-highlight-themes.ts` in
 * the `postbuild` step, after `vite build` has emptied `dist/`.
 */
export function writeHighlightThemes(
    outDir: string,
    themes: readonly HighlightTheme[] = THEMES
): void {
    fs.mkdirSync(outDir, { recursive: true });
    for (const theme of themes) {
        for (const scope of SCOPES) {
            const css = compileHighlightTheme(theme, scope);
            fs.writeFileSync(
                path.join(outDir, highlightFileName(theme, scope)),
                css
            );
        }
    }
}
