/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
    isTcAdmonitionToken,
    markedTcAdmonition,
} from './marked-tc-admonition';
import { marked } from 'marked';

const TYPE_ADMONITION_TC = 'admonitionTc';
// Default options for test
const markedColsInstance = markedTcAdmonition();

describe(markedTcAdmonition.name, () => {
    beforeEach(async () => {
        marked.setOptions(marked.getDefaults());
    });

    it('should parse identify admonition', () => {
        marked.use(markedColsInstance);
        const md = `!!! tip\nsome text\n!!!`;
        const html = `<p class="admonition tip">some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse identify admonition recognizes admonition types', () => {
        marked.use(markedColsInstance);

        const typesIcons = [
            'abstract',
            'info',
            'tip',
            'note',
            'success',
            'question',
            'warning',
            'failure',
            'danger',
            'important',
            'bug',
            'example',
            'quote',
            'custom',
        ];
        for (const type of typesIcons) {
            const md = `!!! ${type}\nsome text\n!!!`;
            const html = `<p class="admonition ${type}">some text</p>\n`;
            expect(marked.parse(md)).toBe(html);
        }
    });

    it('should not parse identify admonition with unkown type', () => {
        marked.use(markedColsInstance);
        const md = `!!! fire\nsome text\n!!!`;
        const html = `<p>!!! fire\nsome text\n!!!</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse identify custom admonition', () => {
        marked.use(markedColsInstance);
        const md = `!!! custom tc-admonition-type="🐼"\nsome text\n!!!`;
        const html = `<p class="admonition custom" data-admonition-icon="🐼">some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse identify custom admonition with space', () => {
        marked.use(markedColsInstance);
        const md = `!!! custom tc-admonition-type="🚀 rocket"\nsome text\n!!!`;
        const html = `<p class="admonition custom" data-admonition-icon="🚀 rocket">some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse identify custom admonition color', () => {
        marked.use(markedColsInstance);
        const md = `!!! custom tc-admonition-type="🐼" tc-admonition-color="#d7be00"\nsome text\n!!!`;
        const html = `<p class="admonition custom" data-admonition-icon="🐼" style="--tc-admonition-bg-color:#d7be00;">some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    // Regression tests for #115: an admonition whose content contains inline
    // Markdown used to crash the whole pipeline with
    // `Error: Token with "strong" type was not found.`, because the
    // tokenizer produces INLINE tokens (via `lexer.inlineTokens`) while the
    // renderer fed them through `parser.parse`, the BLOCK-level entry point.
    it('should not crash and should render bold content inside an admonition (#115)', () => {
        marked.use(markedColsInstance);
        const md = `!!! note\nthis is **bold** content\n!!!`;
        const html = `<p class="admonition note">this is <strong>bold</strong> content</p>\n`;
        expect(() => marked.parse(md)).not.toThrow();
        expect(marked.parse(md)).toBe(html);
    });

    it('should not crash and should render inline code content inside an admonition (#115)', () => {
        marked.use(markedColsInstance);
        const md = '!!! warning\nrun `npm install` first\n!!!';
        const html = `<p class="admonition warning">run <code>npm install</code> first</p>\n`;
        expect(() => marked.parse(md)).not.toThrow();
        expect(marked.parse(md)).toBe(html);
    });

    it('should not crash and should render a link inside an admonition (#115)', () => {
        marked.use(markedColsInstance);
        const md = `!!! info\nsee [the docs](https://example.com) for details\n!!!`;
        const html = `<p class="admonition info">see <a href="https://example.com">the docs</a> for details</p>\n`;
        expect(() => marked.parse(md)).not.toThrow();
        expect(marked.parse(md)).toBe(html);
    });

    it('should not crash and should render nested emphasis inside an admonition (#115)', () => {
        marked.use(markedColsInstance);
        const md = `!!! danger\nthis is **bold with _nested emphasis_ inside**\n!!!`;
        const html = `<p class="admonition danger">this is <strong>bold with <em>nested emphasis</em> inside</strong></p>\n`;
        expect(() => marked.parse(md)).not.toThrow();
        expect(marked.parse(md)).toBe(html);
    });

    it('should not crash and should render multiple inline Markdown features combined inside an admonition (#115)', () => {
        marked.use(markedColsInstance);
        const md = `!!! important\nUse **bold**, \`code\`, and a [link](https://example.com) together\n!!!`;
        const html = `<p class="admonition important">Use <strong>bold</strong>, <code>code</code>, and a <a href="https://example.com">link</a> together</p>\n`;
        expect(() => marked.parse(md)).not.toThrow();
        expect(marked.parse(md)).toBe(html);
    });
});

describe(
    markedTcAdmonition.name + ' - accessible type label (opt-in, #104)',
    () => {
        beforeEach(() => {
            marked.setOptions(marked.getDefaults());
            document.body.innerHTML = '';
        });

        function setSlidesLang(lang?: string): void {
            document.body.innerHTML = `<div class="reveal"><div class="slides"${
                lang ? ` data-lang="${lang}"` : ''
            }></div></div>`;
        }

        it('keeps the default markup unchanged when the option is explicitly disabled', () => {
            marked.use(markedTcAdmonition({ accessibleTypeLabel: false }));
            const md = `!!! note\nsome text\n!!!`;
            const html = `<p class="admonition note">some text</p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('keeps the default markup unchanged when no options are given at all', () => {
            marked.use(markedTcAdmonition());
            const md = `!!! note\nsome text\n!!!`;
            const html = `<p class="admonition note">some text</p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('exposes the type as real, visually-hidden, translated text with role="note" (EN default)', () => {
            setSlidesLang();
            marked.use(markedTcAdmonition({ accessibleTypeLabel: true }));
            const md = `!!! note\nsome text\n!!!`;
            const html =
                '<p class="admonition note tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Note: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('translates the accessible label to French when the slides data-lang is "FR"', () => {
            setSlidesLang('FR');
            marked.use(markedTcAdmonition({ accessibleTypeLabel: true }));
            const md = `!!! warning\nsome text\n!!!`;
            const html =
                '<p class="admonition warning tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Attention: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('falls back to English when the slides data-lang is unsupported', () => {
            setSlidesLang('DE');
            marked.use(markedTcAdmonition({ accessibleTypeLabel: true }));
            const md = `!!! tip\nsome text\n!!!`;
            const html =
                '<p class="admonition tip tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Tip: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('is case-insensitive on the data-lang value ("fr")', () => {
            setSlidesLang('fr');
            marked.use(markedTcAdmonition({ accessibleTypeLabel: true }));
            const md = `!!! danger\nsome text\n!!!`;
            const html =
                '<p class="admonition danger tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Danger: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('uses the author-provided custom type text as the accessible label for custom admonitions', () => {
            setSlidesLang();
            marked.use(markedTcAdmonition({ accessibleTypeLabel: true }));
            const md = `!!! custom tc-admonition-type="🐼 Panda Facts"\nsome text\n!!!`;
            const html =
                '<p class="admonition custom tc-admonition-a11y" data-admonition-icon="🐼 Panda Facts" role="note"><span class="tc-visually-hidden">🐼 Panda Facts: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('falls back to the translated generic "Custom" label when no custom type text is provided', () => {
            setSlidesLang('FR');
            marked.use(markedTcAdmonition({ accessibleTypeLabel: true }));
            const md = `!!! custom\nsome text\n!!!`;
            const html =
                '<p class="admonition custom tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Personnalisé: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('translates the accessible label to an author-supplied language', () => {
            setSlidesLang('ES');
            marked.use(
                markedTcAdmonition({
                    accessibleTypeLabel: true,
                    labels: { ES: { tip: 'Consejo' } },
                })
            );
            const md = `!!! tip\nsome text\n!!!`;
            const html =
                '<p class="admonition tip tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Consejo: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('lets an author-supplied label override a built-in EN/FR translation for the same type', () => {
            setSlidesLang('FR');
            marked.use(
                markedTcAdmonition({
                    accessibleTypeLabel: true,
                    labels: { FR: { note: 'Remarque personnalisée' } },
                })
            );
            const md = `!!! note\nsome text\n!!!`;
            const html =
                '<p class="admonition note tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Remarque personnalisée: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });

        it('falls back to English when neither the built-in nor the author-supplied labels cover the current language', () => {
            setSlidesLang('DE');
            marked.use(
                markedTcAdmonition({
                    accessibleTypeLabel: true,
                    labels: { ES: { tip: 'Consejo' } },
                })
            );
            const md = `!!! tip\nsome text\n!!!`;
            const html =
                '<p class="admonition tip tc-admonition-a11y" role="note"><span class="tc-visually-hidden">Tip: </span>some text</p>\n';
            expect(marked.parse(md)).toBe(html);
        });
    }
);

describe(isTcAdmonitionToken.name, () => {
    it('returns true for valid TcAdmintionToken', () => {
        const validToken = {
            type: TYPE_ADMONITION_TC,
            raw: '::tc-col',
            tokens: [],
        };

        expect(isTcAdmonitionToken(validToken)).toBe(true);
    });

    it('returns false for token with different type', () => {
        const invalidToken = {
            type: 'wrongType',
            raw: '::other-directive',
            tokens: [],
        };

        expect(isTcAdmonitionToken(invalidToken)).toBe(false);
    });

    it('returns false for objects without type property', () => {
        const noTypeToken = {
            type: undefined,
            raw: '::tc-col',
            tokens: [],
        };

        expect(isTcAdmonitionToken(noTypeToken)).toBe(false);
    });
});
