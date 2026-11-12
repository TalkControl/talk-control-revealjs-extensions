import { beforeEach, describe, expect, it } from 'vitest';
import { marked } from 'marked';

import { markedTcIcons } from './marked-tc-icons';

// Default options for test
const markedIconsFontAwesome = markedTcIcons({
    keyword: 'fa-icons',
    copyKeyword: 'fa-copy',
    includesKeyword: false,
    htmlAttribute: 'class',
});

describe(markedTcIcons.name, () => {
    beforeEach(async () => {
        marked.setOptions(marked.getDefaults());
    });

    it('should parse icon', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code 'tc-icons fa-icons')\n`;
        const html = `<p><i class="fa-code tc-icons" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse icon and keep options', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code 'tc-icons fa-icons fa-2xs')\n`;
        const html = `<p><i class="fa-code tc-icons fa-2xs" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse icon and keep options at any position', () => {
        marked.use(markedIconsFontAwesome);
        let md = `![](fa-code 'tc-icons fa-2xs fa-icons')\n`;
        const html = `<p><i class="fa-code tc-icons fa-2xs" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);

        md = `![](fa-code ' fa-2xs tc-icons fa-icons')\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse icon and keep options with space', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code '  tc-icons     fa-2xs    fa-icons     ')\n`;
        const html = `<p><i class="fa-code tc-icons fa-2xs" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse fallback to image if no tc-icons', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code 'fa-2xs fa-icons')\n`;
        const html = `<p><img src="fa-code" alt="" title="fa-2xs fa-icons"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse fallback to image if no keyword', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code 'fa-2xs tc-icons')\n`;
        const html = `<p><img src="fa-code" alt="" title="fa-2xs tc-icons"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should include keyword if asked', () => {
        marked.use(
            markedTcIcons({
                keyword: 'lni',
                copyKeyword: 'copy',
                includesKeyword: true,
                htmlAttribute: 'class',
            })
        );
        const md = `![](lni-telephone-3 'lni tc-icons')\n`;
        const html = `<p><i class="lni lni-telephone-3 tc-icons" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should use the correct html attribute', () => {
        marked.use(
            markedTcIcons({
                keyword: 'feather',
                copyKeyword: 'copy',
                includesKeyword: false,
                htmlAttribute: 'data-feather',
            })
        );
        const md = `![](circle 'feather tc-icons')\n`;
        const html = `<p><i data-feather="circle" class="tc-icons" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should use the correct html attribute and preserve options', () => {
        marked.use(
            markedTcIcons({
                keyword: 'feather',
                copyKeyword: 'copy',
                htmlAttribute: 'data-feather',
            })
        );
        const md = `![](circle 'feather tc-big tc-icons tc-small')\n`;
        const html = `<p><i data-feather="circle" class="tc-icons tc-big tc-small" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should place href in tag if asked', () => {
        marked.use(
            markedTcIcons({
                keyword: 'material-icons',
                copyKeyword: 'copy',
                includesKeyword: true,
                htmlAttribute: 'class',
                iconInTag: true,
            })
        );
        const md = `![](face 'material-icons tc-icons')\n`;
        const html = `<p><i class="material-icons tc-icons" aria-hidden="true">face</i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should use the right transformation if multiples icons marked', () => {
        marked.use(markedIconsFontAwesome);
        marked.use(
            markedTcIcons({
                keyword: 'lni',
                copyKeyword: 'copy',
                includesKeyword: true,
                htmlAttribute: 'class',
            })
        );
        let md = `![](lni-telephone-3 'lni tc-icons')\n`;
        let html = `<p><i class="lni lni-telephone-3 tc-icons" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);

        md = `![](fa-code 'tc-icons fa-icons')\n`;
        html = `<p><i class="fa-code tc-icons" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should keep inline informations before', () => {
        marked.use(markedIconsFontAwesome);
        const md = `some text ![](fa-code 'tc-icons fa-icons')\n`;
        const html = `<p>some text <i class="fa-code tc-icons" aria-hidden="true"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should keep inline informations after', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code 'tc-icons fa-icons') some text\n`;
        const html = `<p><i class="fa-code tc-icons" aria-hidden="true"></i> some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should keep inline informations before and after', () => {
        marked.use(markedIconsFontAwesome);
        const md = `some text ![](fa-code 'tc-icons fa-icons') some text\n`;
        const html = `<p>some text <i class="fa-code tc-icons" aria-hidden="true"></i> some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    describe('accessibility', () => {
        it('should mark an icon as decorative (aria-hidden) by default', () => {
            marked.use(markedIconsFontAwesome);
            const md = `![](fa-code 'tc-icons fa-icons')\n`;
            const html = `<p><i class="fa-code tc-icons" aria-hidden="true"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('should keep an icon decorative (aria-hidden) when marked explicitly', () => {
            marked.use(markedIconsFontAwesome);
            const md = `![](fa-code 'tc-icons fa-icons tc-a11y-hidden')\n`;
            const html = `<p><i class="fa-code tc-icons" aria-hidden="true"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('should strip the tc-a11y-hidden token from the class list', () => {
            marked.use(markedIconsFontAwesome);
            const md = `![](fa-code 'tc-icons fa-icons tc-a11y-hidden tc-big')\n`;
            const html = `<p><i class="fa-code tc-icons tc-big" aria-hidden="true"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('should give a meaningful icon an accessible name', () => {
            marked.use(markedIconsFontAwesome);
            const md = `![](fa-code 'tc-icons fa-icons tc-a11y-label="Open menu"')\n`;
            const html = `<p><i class="fa-code tc-icons" aria-label="Open menu"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('should strip the tc-a11y-label pseudo-attribute from the class list', () => {
            marked.use(markedIconsFontAwesome);
            const md = `![](fa-code 'tc-icons fa-icons tc-a11y-label="Open menu" tc-big')\n`;
            const html = `<p><i class="fa-code tc-icons tc-big" aria-label="Open menu"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('should escape html-significant characters in the accessible name', () => {
            marked.use(markedIconsFontAwesome);
            const md = `![](fa-code 'tc-icons fa-icons tc-a11y-label="A & B <tag>"')\n`;
            const html = `<p><i class="fa-code tc-icons" aria-label="A &amp; B &lt;tag&gt;"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('should prioritize aria-hidden over an accessible name when both are set', () => {
            marked.use(markedIconsFontAwesome);
            const md = `![](fa-code 'tc-icons fa-icons tc-a11y-hidden tc-a11y-label="Open menu"')\n`;
            const html = `<p><i class="fa-code tc-icons" aria-hidden="true"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });

        it('should work with a non-class html attribute', () => {
            marked.use(
                markedTcIcons({
                    keyword: 'feather',
                    copyKeyword: 'copy',
                    includesKeyword: false,
                    htmlAttribute: 'data-feather',
                })
            );
            const md = `![](circle 'feather tc-icons tc-a11y-hidden')\n`;
            const html = `<p><i data-feather="circle" class="tc-icons" aria-hidden="true"></i></p>\n`;
            expect(marked.parse(md)).toBe(html);
        });
    });

    it('should convert multiples icons', () => {
        marked.use(markedIconsFontAwesome);
        marked.use(
            markedTcIcons({
                keyword: 'lni',
                copyKeyword: 'copy',
                includesKeyword: true,
                htmlAttribute: 'class',
            })
        );
        const md = `some text ![](fa-code 'tc-icons fa-icons') some text ![](lni-telephone-3 'lni tc-icons') some text\n`;
        const html = `<p>some text <i class="fa-code tc-icons" aria-hidden="true"></i> some text <i class="lni lni-telephone-3 tc-icons" aria-hidden="true"></i> some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });
});
