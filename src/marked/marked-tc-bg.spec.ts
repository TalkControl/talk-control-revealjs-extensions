import { beforeEach, describe, expect, it } from 'vitest';
import { marked } from 'marked';

import { markedTcBg } from './marked-tc-bg';

// Default options for test
const markedBgInstance = markedTcBg();

describe(markedTcBg.name, () => {

    beforeEach(async () => {
        marked.setOptions(marked.getDefaults());
    });

    it('should parse bg image path', () => {
        marked.use(markedBgInstance);
        const md = `![](../assets/images/jf.jpg 'tc-bg')\n`;
        const html = `<!-- .slide: data-background="../assets/images/jf.jpg" -->\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse bg color name', () => {
        marked.use(markedBgInstance);
        const md = `![](red 'tc-bg')\n`;
        const html = `<!-- .slide: data-background="red" -->\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse bg color rgb', () => {
        marked.use(markedBgInstance);
        const md = `![](rgb(255, 0, 0) 'tc-bg')\n`;
        const html = `<!-- .slide: data-background="rgb(255, 0, 0)" -->\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse bg color hash', () => {
        marked.use(markedBgInstance);
        const md = `![](#ff0000 'tc-bg')\n`;
        const html = `<!-- .slide: data-background="#ff0000" -->\n`;
        expect(marked.parse(md)).toBe(html);
    });

});