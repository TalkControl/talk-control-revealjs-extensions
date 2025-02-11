import { beforeEach, describe, expect, it } from 'vitest';
import { isTcColToken, markedTcCols } from './marked-tc-cols';
import { marked } from 'marked';


const TYPE_COL_TC = 'colTc';
// Default options for test
const markedColsInstance = markedTcCols();

describe(markedTcCols.name, () => {

    beforeEach(async () => {
        marked.setOptions(marked.getDefaults());
    });

    it('should parse identify columns', () => {
        marked.use(markedColsInstance);
        const md = `##++##\nsome text\n##++##\n`;
        const html = `<div class="tc-column"><section class="tc-column">\n<p>some text</p>\n\n</section></div>`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should deals correctly carriage return', () => {
        marked.use(markedColsInstance);
        const md = `##++##\nsome text\nsame paragraph\n##++##\n`;
        const html = `<div class="tc-column"><section class="tc-column">\n<p>some text\nsame paragraph</p>\n\n</section></div>`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should deals correctly paragraph', () => {
        marked.use(markedColsInstance);
        const md = `##++##\nsome text\n\nother paragraph\n##++##\n`;
        const html = `<div class="tc-column"><section class="tc-column">\n<p>some text</p>\n<p>other paragraph</p>\n\n</section></div>`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse preserve attributes', () => {
        marked.use(markedColsInstance);
        const md = `##++## class="test" style="color:red;"\nsome text\n##++##\n`;
        const html = `<div class="tc-column"><section style="color:red;" class="tc-column test">\n<p>some text</p>\n\n</section></div>`;
        expect(marked.parse(md)).toBe(html);
    });
});

describe(isTcColToken.name, () => {

    it('returns true for valid TcColToken', () => {
        const validToken = {
            type: TYPE_COL_TC,
            raw: '::tc-col',
            tokens: []
        };

        expect(isTcColToken(validToken)).toBe(true);
    });

    it('returns false for token with different type', () => {
        const invalidToken = {
            type: 'wrongType',
            raw: '::other-directive',
            tokens: []
        };

        expect(isTcColToken(invalidToken)).toBe(false);
    });

    it('returns false for objects without type property', () => {
        const noTypeToken = {
            type: undefined,
            raw: '::tc-col',
            tokens: []
        };

        expect(isTcColToken(noTypeToken)).toBe(false);
    });


});