import * as path from 'node:path';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Freezes the *shape* of the `max-height` rule introduced for issue #88: the
 * `<code>` box must be capped by the lesser of the configured line-count
 * ceiling (`--tc-code-max-lines`) and the height actually available on the
 * slide (`--slide-height`), so reveal's highlight plugin keeps an internal
 * scrollbar to center highlighted lines on tall `big-code` blocks.
 *
 * This does not assert the rendered effect (no layout engine runs here) -
 * that is covered by the Playwright scenario in `e2e/code-highlight.spec.ts`.
 */
function compileCodeSlidesCss(): string {
    const scssPath = path.resolve(__dirname, 'code-slides.scss');
    return sass.compile(scssPath).css;
}

function extractMaxHeightDeclaration(css: string): string {
    const selector =
        '.reveal .slides *:is(.with-code, .with-code-dark, .with-code-bg-dark) pre code';
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blockPattern = new RegExp(`${escapedSelector}\\s*{([^}]*)}`);
    const block = blockPattern.exec(css);
    if (!block) {
        throw new Error(`Could not find CSS block for selector "${selector}"`);
    }
    const propertyPattern = /max-height:\s*([^;]+);/;
    const propertyMatch = propertyPattern.exec(block[1]);
    if (!propertyMatch) {
        throw new Error('Could not find "max-height" declaration');
    }
    return propertyMatch[1].trim();
}

describe('code-slides.scss max-height rule (issue #88)', () => {
    const css = compileCodeSlidesCss();
    const maxHeight = extractMaxHeightDeclaration(css);

    it('caps the height with a min() of two candidates', () => {
        expect(maxHeight).toContain('min(');
    });

    it('references --slide-height as the available-space candidate', () => {
        expect(maxHeight).toContain('--slide-height');
    });

    it('keeps --tc-code-max-lines as the secondary, line-count ceiling', () => {
        expect(maxHeight).toContain('--tc-code-max-lines');
    });

    it('falls back to a numeric slide height when --slide-height is unset', () => {
        expect(maxHeight).toMatch(/var\(--slide-height,\s*\d+px\)/);
    });
});
