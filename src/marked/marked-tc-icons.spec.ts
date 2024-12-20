import { beforeEach, describe, expect, it } from 'vitest';
import { marked } from 'marked';

import { markedTcIcons } from './marked-tc-icons';

// Default options for test
const markedIconsFontAwesome = markedTcIcons({
    keyword: 'fa-icons',
    includesKeyword: false,
    htmlAttribute: 'class'
});

describe(markedTcIcons.name, () => {

    beforeEach(async () => {
        marked.setOptions(marked.getDefaults());
    });

    it('should parse icon', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code 'tc-icons fa-icons')\n`;
        const html = `<p><i class="fa-code tc-icons"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse icon and keep options', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code 'tc-icons fa-icons fa-2xs')\n`;
        const html = `<p><i class="fa-code tc-icons fa-2xs"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse icon and keep options at any position', () => {
        marked.use(markedIconsFontAwesome);
        let md = `![](fa-code 'tc-icons fa-2xs fa-icons')\n`;
        const html = `<p><i class="fa-code tc-icons fa-2xs"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);

        md = `![](fa-code ' fa-2xs tc-icons fa-icons')\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse icon and keep options with space', () => {
        marked.use(markedIconsFontAwesome);
        const md = `![](fa-code '  tc-icons     fa-2xs    fa-icons     ')\n`;
        const html = `<p><i class="fa-code tc-icons fa-2xs"></i></p>\n`;
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
        marked.use(markedTcIcons({
            keyword: 'lni',
            includesKeyword: true,
            htmlAttribute: 'class'
        }));
        const md = `![](lni-telephone-3 'lni tc-icons')\n`;
        const html = `<p><i class="lni lni-telephone-3 tc-icons"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);

    });

    it('should use the correct html attribute', () => {
        marked.use(markedTcIcons({
            keyword: 'feather',
            includesKeyword: false,
            htmlAttribute: 'data-feather'
        }));
        const md = `![](circle 'feather tc-icons')\n`;
        const html = `<p><i data-feather="circle" class="tc-icons"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);

    });

    it('should place href in tag if asked', () => {
        marked.use(markedTcIcons({
            keyword: 'material-icons',
            includesKeyword: true,
            htmlAttribute: 'class',
            iconInTag: true
        }));
        const md = `![](face 'material-icons tc-icons')\n`;
        const html = `<p><i class="material-icons tc-icons">face</i></p>\n`;
        expect(marked.parse(md)).toBe(html);

    });

    it('should use the right transformation if multiples icons marked', () => {
        marked.use(markedIconsFontAwesome);
        marked.use(markedTcIcons({
            keyword: 'lni',
            includesKeyword: true,
            htmlAttribute: 'class'
        }));
        let md = `![](lni-telephone-3 'lni tc-icons')\n`;
        let html = `<p><i class="lni lni-telephone-3 tc-icons"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);

        md = `![](fa-code 'tc-icons fa-icons')\n`;
        html = `<p><i class="fa-code tc-icons"></i></p>\n`;
        expect(marked.parse(md)).toBe(html);

    });

});