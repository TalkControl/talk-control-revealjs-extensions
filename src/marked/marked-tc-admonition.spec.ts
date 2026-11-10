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
