import * as path from 'node:path';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../../../scripts/utils/contrast.utils';

const ADMONITION_TYPES = [
    'note',
    'abstract',
    'tip',
    'info',
    'success',
    'question',
    'warning',
    'failure',
    'danger',
    'important',
    'bug',
    'example',
    'quote',
] as const;

// `custom` is intentionally excluded: its color is left to the deck author
// (documented in docs/admonition.md), so it has no fixed contrast to assert on.

const LIGHT_THEME_BACKGROUND = '#ffffff';
const MINIMUM_TEXT_CONTRAST = 4.5; // WCAG 1.4.3 (AA, normal text)
const MINIMUM_BORDER_CONTRAST = 3; // WCAG 1.4.11 (non-text contrast)

function compileAdmonitionCss(): string {
    const scssPath = path.resolve(__dirname, 'admonition.scss');
    return sass.compile(scssPath).css;
}

function extractColor(css: string, selector: string, property: string): string {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blockPattern = new RegExp(`${escapedSelector}\\s*{([^}]*)}`);
    const block = blockPattern.exec(css);
    if (!block) {
        throw new Error(`Could not find CSS block for selector "${selector}"`);
    }
    const propertyPattern = new RegExp(`${property}:\\s*([^;]+);`);
    const propertyMatch = propertyPattern.exec(block[1]);
    if (!propertyMatch) {
        throw new Error(
            `Could not find property "${property}" in block "${selector}"`
        );
    }
    return propertyMatch[1].trim();
}

describe('admonition.scss contrast (WCAG 1.4.3 / 1.4.11)', () => {
    const css = compileAdmonitionCss();

    it.each(ADMONITION_TYPES)(
        'type "%s" has a text (::before) contrast ratio >= 4.5:1 on white',
        (type) => {
            const textColor = extractColor(
                css,
                `.reveal .slides section .admonition.${type}:before`,
                'color'
            );
            expect(
                contrastRatio(textColor, LIGHT_THEME_BACKGROUND)
            ).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST);
        }
    );

    it.each(ADMONITION_TYPES)(
        'type "%s" has a border contrast ratio >= 3:1 on white',
        (type) => {
            const borderColor = extractColor(
                css,
                `.reveal .slides section .admonition.${type}`,
                'border-left-color'
            );
            expect(
                contrastRatio(borderColor, LIGHT_THEME_BACKGROUND)
            ).toBeGreaterThanOrEqual(MINIMUM_BORDER_CONTRAST);
        }
    );
});
