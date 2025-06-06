/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { marked } from 'marked';

import { markedTcQrCode } from './marked-tc-qrcode';

const dataBase64 =
    'data:image/gif;base64,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';

// Default options for test
const markedQrCode = markedTcQrCode();

describe(markedTcQrCode.name, () => {
    beforeEach(async () => {
        marked.setOptions(marked.getDefaults());
    });

    it('should parse qrcode', () => {
        marked.use(markedQrCode);
        const md = `![](data 'tc-qrcode')\n`;
        const html = `<p><img src="${dataBase64}" class="tc-qrcode" alt="qrcode with base64 information, original text is: data"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse qrcode and keep classes', () => {
        marked.use(markedQrCode);
        const md = `![](data 'tc-qrcode class-1')\n`;
        const html = `<p><img src="${dataBase64}" class="tc-qrcode class-1" alt="qrcode with base64 information, original text is: data"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse qrcode and keep classes at any position', () => {
        marked.use(markedQrCode);
        const md = `![](data 'class-1 tc-qrcode class-2')\n`;
        const html = `<p><img src="${dataBase64}" class="class-1 tc-qrcode class-2" alt="qrcode with base64 information, original text is: data"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse qrcode and keep options with space', () => {
        marked.use(markedQrCode);
        const md = `![](data '  tc-qrcode     class-1     ')\n`;
        const html = `<p><img src="${dataBase64}" class="tc-qrcode class-1" alt="qrcode with base64 information, original text is: data"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should parse fallback to image if no tc-qrcode', () => {
        marked.use(markedQrCode);
        const md = `![](data 'class-1')\n`;
        const html = `<p><img src="data" alt="" title="class-1"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should keep inline informations before', () => {
        marked.use(markedQrCode);
        const md = `some text ![](data 'tc-qrcode')\n`;
        const html = `<p>some text <img src="${dataBase64}" class="tc-qrcode" alt="qrcode with base64 information, original text is: data"></p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should keep inline informations after', () => {
        marked.use(markedQrCode);
        const md = `![](data 'tc-qrcode') some text\n`;
        const html = `<p><img src="${dataBase64}" class="tc-qrcode" alt="qrcode with base64 information, original text is: data"> some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });

    it('should keep inline informations before and after', () => {
        marked.use(markedQrCode);
        const md = `some text ![](data 'tc-qrcode') some text\n`;
        const html = `<p>some text <img src="${dataBase64}" class="tc-qrcode" alt="qrcode with base64 information, original text is: data"> some text</p>\n`;
        expect(marked.parse(md)).toBe(html);
    });
});
