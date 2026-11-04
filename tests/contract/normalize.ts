/**
 * Normalization helpers for the contract (characterization) snapshots.
 *
 * The goal is a snapshot that is stable and readable in a pull request diff,
 * without hiding real behaviour changes. We therefore only normalize:
 * - data URIs (huge base64 payloads), replaced by a short content hash;
 * - line endings and trailing whitespace;
 * - for CSS, one line per declaration (no sorting: order matters for the
 *   cascade).
 */
import { createHash } from 'node:crypto';

/** First 12 hex chars of the sha256 of the input. */
export function sha256Short(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function hashDataUri(dataUri: string): string {
    return `data:<sha256-${sha256Short(dataUri)}>`;
}

function normalizeLines(text: string): string {
    return (
        text
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .map((line) => line.replace(/[ \t]+$/, ''))
            .join('\n')
            .trimEnd() + '\n'
    );
}

/**
 * Normalizes an HTML fragment produced by the markdown pipeline:
 * data URIs in attributes (e.g. QR codes) are replaced by their hash.
 */
export function normalizeHtml(html: string): string {
    const withHashedUris = html.replace(
        /(=\s*)(["'])(data:[^"']*)\2/g,
        (_match, eq: string, quote: string, uri: string) =>
            `${eq}${quote}${hashDataUri(uri)}${quote}`
    );
    return normalizeLines(withHashedUris);
}

/** Replaces every `url(data:...)` (quoted or not) by `url(data:<sha256-12>)`. */
export function hashCssDataUris(css: string): string {
    return css.replace(
        /url\(\s*(?:"(data:[^"]*)"|'(data:[^']*)'|(data:[^)]*))\s*\)/g,
        (_match, dq?: string, sq?: string, bare?: string) =>
            `url(${hashDataUri((dq ?? sq ?? bare) as string)})`
    );
}

/**
 * Iterates over a CSS string, skipping comments and quoted strings, and calls
 * `onChar` for every structural character (`{`, `}`, `;`) found outside of
 * them.
 */
function scanCss(
    css: string,
    onStructural: (char: '{' | '}' | ';', index: number) => void
): void {
    let i = 0;
    while (i < css.length) {
        const char = css[i];
        if (char === '/' && css[i + 1] === '*') {
            const end = css.indexOf('*/', i + 2);
            i = end === -1 ? css.length : end + 2;
            continue;
        }
        if (char === '"' || char === "'") {
            i++;
            while (i < css.length && css[i] !== char) {
                i += css[i] === '\\' ? 2 : 1;
            }
            i++;
            continue;
        }
        if (char === '{' || char === '}' || char === ';') {
            onStructural(char, i);
        }
        i++;
    }
}

/**
 * Normalizes compiled CSS for a file snapshot: data URIs hashed, then a line
 * break after each `{`, `;` and `}` (outside strings and comments).
 * Rules are NOT sorted: the order is part of the contract (cascade).
 */
export function normalizeCss(css: string): string {
    const hashed = hashCssDataUris(css);
    const breaks: number[] = [];
    scanCss(hashed, (_char, index) => breaks.push(index));
    let out = '';
    let last = 0;
    for (const index of breaks) {
        out += hashed.slice(last, index + 1).trim() + '\n';
        last = index + 1;
    }
    out += hashed.slice(last).trim();
    return normalizeLines(
        out
            .split('\n')
            .filter((line) => line.length > 0)
            .join('\n')
    );
}

function splitDeclarations(block: string): string[] {
    const declarations: string[] = [];
    let last = 0;
    scanCss(block, (char, index) => {
        if (char === ';') {
            declarations.push(block.slice(last, index));
            last = index + 1;
        }
    });
    declarations.push(block.slice(last));
    return declarations.map((d) => d.trim()).filter((d) => d.length > 0);
}

/**
 * Extracts every `--r-*` and `--tc-*` custom property declared in a
 * top-level `:root` rule, in source order. When a property is declared
 * several times, the last declaration wins (like the cascade).
 */
export function extractRootCustomProperties(
    css: string
): Record<string, string> {
    const hashed = hashCssDataUris(css);
    const result: Record<string, string> = {};
    // One frame per open block: its prelude (selector or at-rule) and the
    // index where its body starts.
    const stack: Array<{ prelude: string; bodyStart: number }> = [];
    // Start of the current prelude (after the last `{`, `}` or top-level `;`).
    let preludeStart = 0;
    scanCss(hashed, (char, index) => {
        if (char === ';') {
            if (stack.length === 0) {
                // Top-level statement such as `@charset "UTF-8";`.
                preludeStart = index + 1;
            }
            return;
        }
        if (char === '{') {
            const prelude = hashed
                .slice(preludeStart, index)
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .trim();
            stack.push({ prelude, bodyStart: index + 1 });
            preludeStart = index + 1;
            return;
        }
        // char === '}'
        preludeStart = index + 1;
        const frame = stack.pop();
        const isTopLevelRoot =
            stack.length === 0 &&
            frame !== undefined &&
            frame.prelude
                .split(',')
                .map((selector) => selector.trim())
                .includes(':root');
        if (isTopLevelRoot) {
            const body = hashed.slice(frame.bodyStart, index);
            for (const declaration of splitDeclarations(body)) {
                const colon = declaration.indexOf(':');
                if (colon === -1) continue;
                const name = declaration.slice(0, colon).trim();
                const value = declaration.slice(colon + 1).trim();
                if (name.startsWith('--r-') || name.startsWith('--tc-')) {
                    // Delete first so that a redeclaration moves to the end.
                    delete result[name];
                    result[name] = value;
                }
            }
        }
    });
    return result;
}

const NAMED_COLORS: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
};

/**
 * Normalizes a CSS value for comparison across minifiers:
 * lowercase, collapsed whitespace, `#abc` → `#aabbcc`, `white` → `#ffffff`.
 */
export function normalizeCssValue(value: string): string {
    const lower = value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (NAMED_COLORS[lower]) {
        return NAMED_COLORS[lower];
    }
    const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(lower);
    if (shortHex) {
        return `#${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}${shortHex[3]}${shortHex[3]}`;
    }
    return lower;
}
