/**
 * @vitest-environment jsdom
 */
import * as markedModule from 'marked';
import { describe, expect, it } from 'vitest';
import { markedTcMermaid } from './marked-tc-mermaid';

type Engine = { parse(src: string): string };

/** A fresh engine per call: the diagram counter lives in the extension. */
function newEngine(): Engine {
    // `@types/marked` 4.3 does not declare the `Marked` class (marked >= 5).
    const { Marked } = markedModule as unknown as {
        Marked: new () => Engine & { use(...extensions: unknown[]): unknown };
    };
    const engine = new Marked();
    engine.use(markedTcMermaid());
    return engine;
}

function render(md: string): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = newEngine().parse(md);
    return container;
}

const SOURCE = 'flowchart LR\n  A["Markdown"] --> B["Slide"]';

describe(markedTcMermaid.name, () => {
    it('renders a figure with an empty diagram and the source in a pre', () => {
        const root = render('```mermaid\n' + SOURCE + '\n```\n');

        const figure = root.querySelector('figure.tc-mermaid');
        expect(figure).not.toBeNull();
        expect(figure?.getAttribute('data-tc-mermaid')).toBe('0');
        const diagram = figure?.querySelector('.tc-mermaid-diagram');
        expect(diagram?.children.length).toBe(0);
        expect(diagram?.textContent).toBe('');
        const source = figure?.querySelector('pre.tc-mermaid-source');
        expect(source?.textContent).toBe(SOURCE);
        // No <code>: reveal's highlight plugin must not pick the source up.
        expect(source?.querySelector('code')).toBeNull();
    });

    it('puts fragment words on the figure and every other word on the diagram', () => {
        const root = render(
            '```mermaid h-400 fragment center fade-up\nflowchart LR\n A --> B\n```\n'
        );

        const figure = root.querySelector('figure.tc-mermaid')!;
        const diagram = figure.querySelector('.tc-mermaid-diagram')!;
        expect(Array.from(figure.classList).sort()).toEqual([
            'fade-up',
            'fragment',
            'tc-mermaid',
        ]);
        expect(Array.from(diagram.classList).sort()).toEqual([
            'center',
            'h-400',
            'tc-mermaid-diagram',
        ]);
    });

    it('ignores words that are not valid class names', () => {
        const root = render(
            '```mermaid h-400 "quoted" <b> 9lives ok_\nflowchart LR\n A --> B\n```\n'
        );

        expect(
            Array.from(
                root.querySelector('.tc-mermaid-diagram')!.classList
            ).sort()
        ).toEqual(['h-400', 'tc-mermaid-diagram']);
    });

    it.each([
        ['tildes', '~~~mermaid\n' + SOURCE + '\n~~~\n'],
        ['four backticks', '````mermaid\n' + SOURCE + '\n````\n'],
        ['a longer closing fence', '```mermaid\n' + SOURCE + '\n`````\n'],
        ['no closing fence', '```mermaid\n' + SOURCE + '\n'],
    ])('accepts %s', (_name, md) => {
        const root = render(md);

        expect(root.querySelectorAll('figure.tc-mermaid')).toHaveLength(1);
        expect(root.querySelector('pre.tc-mermaid-source')?.textContent).toBe(
            SOURCE
        );
    });

    it.each([
        [1, ' ```mermaid\n A --> B\n   C\n ```\n'],
        [3, '   ```mermaid\n   A --> B\n     C\n```\n'],
    ])(
        'strips up to the fence indentation (%i space) from the source lines',
        (_indent, md) => {
            const root = render(md);

            expect(
                root.querySelector('pre.tc-mermaid-source')?.textContent
            ).toBe('A --> B\n  C');
        }
    );

    it('keeps what follows the block as regular content', () => {
        const root = render('```mermaid\n' + SOURCE + '\n```\n\nafter\n');

        expect(root.querySelector('p')?.textContent).toBe('after');
    });

    it('escapes the source: no markup comes out of it', () => {
        const root = render(
            '```mermaid\nflowchart LR\n  A["<b>x</b> & y"] --> B\n```\n'
        );

        expect(root.querySelector('b')).toBeNull();
        expect(root.querySelector('pre.tc-mermaid-source')?.textContent).toBe(
            'flowchart LR\n  A["<b>x</b> & y"] --> B'
        );
    });

    it.each([
        ['another language', '```js\nconst a = 1;\n```\n'],
        ['a longer info word', '```mermaidjs\nA --> B\n```\n'],
        ['a space before the word', '``` mermaid\nA --> B\n```\n'],
        ['an indented code block', '    mermaid\n'],
    ])('leaves %s as regular code', (_name, md) => {
        const root = render(md);

        expect(root.querySelector('figure.tc-mermaid')).toBeNull();
        expect(root.querySelector('pre')).not.toBeNull();
    });

    it('numbers the diagrams of a deck, restarting with a new extension', () => {
        const engine = newEngine();
        const first = document.createElement('div');
        first.innerHTML = engine.parse(
            '```mermaid\nA --> B\n```\n\n```mermaid\nB --> C\n```\n'
        );
        const second = document.createElement('div');
        second.innerHTML = engine.parse('```mermaid\nC --> D\n```\n');

        expect(
            Array.from(first.querySelectorAll('figure')).map((f) =>
                f.getAttribute('data-tc-mermaid')
            )
        ).toEqual(['0', '1']);
        expect(
            second.querySelector('figure')?.getAttribute('data-tc-mermaid')
        ).toBe('2');
        expect(
            render('```mermaid\nA --> B\n```\n')
                .querySelector('figure')
                ?.getAttribute('data-tc-mermaid')
        ).toBe('0');
    });

    it('works right after a paragraph', () => {
        const root = render('text\n\n```mermaid\nA --> B\n```\n');

        expect(root.querySelector('p')?.textContent).toBe('text');
        expect(root.querySelectorAll('figure.tc-mermaid')).toHaveLength(1);
    });
});
