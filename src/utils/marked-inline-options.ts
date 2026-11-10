// Internal parsing helpers shared by the marked-tc-* inline extensions
// (marked-tc-icons, marked-tc-qrcode) that embed pseudo-attributes in the
// quoted Markdown image title, eg. `![](src 'tc-icons tc-a11y-label="..."')`.
// Not part of the library's public API: not re-exported from src/index.ts.

/**
 * Extracts an optional `key="value"` pseudo-attribute embedded in a marked-tc-*
 * inline options string (eg. the quoted part of
 * `![](src 'tc-icons tc-a11y-label="Open menu"')`).
 * @param {string} options - the raw options string to parse
 * @param {string} key - the pseudo-attribute name to look for (eg. `tc-a11y-label`)
 * @returns the extracted value (if present) and the options string with that
 * pseudo-attribute removed, so the remaining tokens can still be space-split safely
 */
export function extractQuotedOption(
    options: string,
    key: string
): { value?: string; remaining: string } {
    const match = new RegExp(`${key}="([^"]*)"`).exec(options);
    if (!match) {
        return { value: undefined, remaining: options };
    }
    return {
        value: match[1],
        remaining: options.replace(match[0], ' ').replace(/\s+/g, ' ').trim(),
    };
}

/**
 * Extracts an optional standalone boolean flag token (eg. `tc-a11y-hidden`) from a
 * marked-tc-* inline options string.
 * @param {string} options - the raw options string to parse
 * @param {string} flag - the flag token to look for
 * @returns whether the flag was present and the options string with that token removed
 */
export function extractFlagOption(
    options: string,
    flag: string
): { present: boolean; remaining: string } {
    const present = new RegExp(`(?:^|\\s)${flag}(?:\\s|$)`).test(
        ` ${options} `
    );
    const remaining = present
        ? options
              .replace(new RegExp(flag, 'g'), ' ')
              .replace(/\s+/g, ' ')
              .trim()
        : options;
    return { present, remaining };
}

/**
 * Escapes a string for safe inclusion inside a double-quoted HTML attribute value.
 * @param {string} value - the raw string to escape
 * @returns the escaped string
 */
export function escapeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
