import { describe, expect, it } from 'vitest';
import { markedTcStyledImage } from './marked-tc-styled-image';

interface ImageToken {
    href: string;
    title?: string | null;
    text: string;
}
type ImageRenderer = (...args: unknown[]) => string;

const KNOWN = ['h-400', 'float-left', 'center', 'mt-10'];

const imageRenderer = (knownStyles = KNOWN): ImageRenderer =>
    (
        markedTcStyledImage({ knownStyles }).renderer as {
            image: ImageRenderer;
        }
    ).image;

// Literal outputs, captured byte for byte from @anthonypena/marked-styled-image@0.0.1
// (the dependency this module replaces). No extra escaping, on purpose.
const CASES: Array<[string, string, string | null | undefined, string]> = [
    ['x.png', 'alt', undefined, '<img src="x.png" alt="alt"/>'],
    ['x.png', 'alt', null, '<img src="x.png" alt="alt"/>'],
    ['x.png', 'alt', '', '<img src="x.png" alt="alt"/>'],
    ['x.png', '', 'h-400', '<img src="x.png" alt="" class="h-400"/>'],
    [
        'x.png',
        'texte',
        'h-400 float-left',
        '<img src="x.png" alt="texte" class="h-400 float-left"/>',
    ],
    [
        'x.png',
        'texte',
        'mon titre h-400 float-left',
        '<img src="x.png" alt="texte" title="mon titre" class="h-400 float-left"/>',
    ],
    [
        'x.png',
        'texte',
        'custom-style',
        '<img src="x.png" alt="texte" title="custom-style"/>',
    ],
    [
        'x.png',
        'a "quoted" <b>',
        'center',
        '<img src="x.png" alt="a "quoted" <b>" class="center"/>',
    ],
    [
        './a b/y.png',
        'alt',
        'mt-10 titre',
        '<img src="./a b/y.png" alt="alt" title="titre" class="mt-10"/>',
    ],
    [
        'x.png',
        'alt',
        'titre sans style',
        '<img src="x.png" alt="alt" title="titre sans style"/>',
    ],
];

describe('markedTcStyledImage', () => {
    it.each(CASES)(
        'positional signature %s | %s | %s',
        (href, text, title, expected) => {
            expect(imageRenderer()(href, title, text)).toBe(expected);
        }
    );

    it.each(CASES)(
        'token signature gives the same output %s | %s | %s',
        (href, text, title, expected) => {
            const token: ImageToken = { href, title, text };
            expect(imageRenderer()(token)).toBe(expected);
        }
    );

    it('renders an image without title as a bare img', () => {
        expect(imageRenderer()('x.png', undefined, 'texte')).toBe(
            '<img src="x.png" alt="texte"/>'
        );
    });

    it('splits a mixed title into title and class', () => {
        const html = imageRenderer()(
            'x.png',
            'mon titre h-400 float-left',
            'texte'
        );
        expect(html).toContain('class="h-400 float-left"');
        expect(html).toContain('title="mon titre"');
    });

    it('keeps unknown styles in the title', () => {
        expect(imageRenderer()('x.png', 'inconnu', 'a')).toBe(
            '<img src="x.png" alt="a" title="inconnu"/>'
        );
    });

    it('honours custom knownStyles', () => {
        const render = imageRenderer(['my-style']);
        expect(render('x.png', 'my-style h-400', 'a')).toBe(
            '<img src="x.png" alt="a" title="h-400" class="my-style"/>'
        );
    });
});
