/**
 * @vitest-environment jsdom
 */
import {
    TcVendorLoadError,
    _internals as loaderInternals,
} from '../utils/tc-vendor-loader';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { manageMermaid } from './tc-mermaid';

type RenderResult = { svg: string; bindFunctions?: (el: Element) => void };

function figure(index: number, source: string): string {
    return (
        `<figure class="tc-mermaid" data-tc-mermaid="${index}">` +
        `<div class="tc-mermaid-diagram"></div>` +
        `<pre class="tc-mermaid-source">${source}</pre></figure>`
    );
}

function buildDeck(theme: string, ...sections: string[][]): void {
    document.body.innerHTML =
        `<div class="reveal"><div class="slides" data-theme="${theme}">` +
        sections
            .map((figures) => `<section>${figures.join('')}</section>`)
            .join('') +
        `</div></div>`;
}

function createFakeMermaid(
    render: (
        id: string,
        text: string,
        container?: Element
    ) => Promise<RenderResult> = async (id) => ({
        svg: `<svg data-id="${id}"></svg>`,
    })
) {
    return {
        initialize: vi.fn(),
        render: vi.fn(render),
    };
}

function installFakeMermaid(fake: ReturnType<typeof createFakeMermaid>) {
    const importer = vi.fn<(url: string) => Promise<unknown>>(async () => ({
        default: fake,
    }));
    loaderInternals!.setImporter(importer);
    return importer;
}

describe('manageMermaid', () => {
    beforeEach(() => {
        loaderInternals!.resetCache();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('does nothing, and loads nothing, when the deck has no diagram', async () => {
        buildDeck('', []);
        const importer = installFakeMermaid(createFakeMermaid());

        await manageMermaid();

        expect(importer).not.toHaveBeenCalled();
    });

    it('imports Mermaid once and initializes it once, with the safe defaults', async () => {
        buildDeck('', [figure(0, 'A --> B'), figure(1, 'C --> D')]);
        const fake = createFakeMermaid();
        const importer = installFakeMermaid(fake);

        await manageMermaid();

        expect(importer).toHaveBeenCalledTimes(1);
        expect(importer.mock.calls[0][0]).toMatch(
            /vendor\/mermaid\/dist\/mermaid\.esm\.min\.mjs$/
        );
        expect(fake.initialize).toHaveBeenCalledTimes(1);
        expect(fake.initialize).toHaveBeenCalledWith(
            expect.objectContaining({
                startOnLoad: false,
                securityLevel: 'strict',
                suppressErrorRendering: true,
            })
        );
        expect(fake.render).toHaveBeenCalledTimes(2);
    });

    it('merges the author config over the defaults', async () => {
        buildDeck('', [figure(0, 'A --> B')]);
        const fake = createFakeMermaid();
        installFakeMermaid(fake);

        await manageMermaid({
            config: { securityLevel: 'loose', flowchart: { curve: 'linear' } },
        });

        expect(fake.initialize).toHaveBeenCalledWith(
            expect.objectContaining({
                startOnLoad: false,
                securityLevel: 'loose',
                flowchart: { curve: 'linear' },
            })
        );
    });

    describe('theme', () => {
        async function themeFor(
            dataTheme: string,
            options = {}
        ): Promise<unknown> {
            buildDeck(dataTheme, [figure(0, 'A --> B')]);
            const fake = createFakeMermaid();
            installFakeMermaid(fake);
            await manageMermaid(options);
            return fake.initialize.mock.calls[0][0].theme;
        }

        it('uses the dark Mermaid theme for data-theme="dark"', async () => {
            expect(await themeFor('dark')).toBe('dark');
        });

        it('uses the default Mermaid theme when no data-theme is set', async () => {
            expect(await themeFor('')).toBe('default');
        });

        it('uses the default Mermaid theme for an unknown data-theme', async () => {
            expect(await themeFor('corporate')).toBe('default');
        });

        it('maps a custom data-theme with the themes option', async () => {
            expect(
                await themeFor('corporate', {
                    themes: { corporate: 'neutral' },
                })
            ).toBe('neutral');
        });

        it('keeps the dark default next to a custom mapping', async () => {
            expect(
                await themeFor('dark', { themes: { corporate: 'neutral' } })
            ).toBe('dark');
        });

        it('lets an explicit config.theme win', async () => {
            expect(
                await themeFor('dark', { config: { theme: 'forest' } })
            ).toBe('forest');
        });
    });

    it('renders the decoded source off-screen and inserts the SVG after it', async () => {
        buildDeck('', [figure(0, 'A --&gt; B &amp; C')]);
        let containerSeen: Element | undefined;
        const bindFunctions = vi.fn();
        const fake = createFakeMermaid(async (id, _text, container) => {
            containerSeen = container;
            return { svg: `<svg data-id="${id}"></svg>`, bindFunctions };
        });
        installFakeMermaid(fake);

        await manageMermaid();

        const [id, text] = fake.render.mock.calls[0];
        expect(id).toBe('tc-mermaid-0');
        expect(text).toBe('A --> B & C');
        expect(containerSeen).toBeDefined();
        expect(containerSeen!.closest('.reveal')).toBeNull();
        const figureElement = document.querySelector('figure')!;
        expect(figureElement.getAttribute('data-tc-mermaid-state')).toBe(
            'rendered'
        );
        const diagram = figureElement.querySelector('.tc-mermaid-diagram')!;
        expect(diagram.querySelector('svg')?.getAttribute('data-id')).toBe(
            'tc-mermaid-0'
        );
        expect(bindFunctions).toHaveBeenCalledWith(diagram);
        // The off-screen container does not outlive the rendering.
        expect(containerSeen!.isConnected).toBe(false);
    });

    it('renders the diagrams of the current slide first', async () => {
        buildDeck('', [figure(0, 'first')], [figure(1, 'current')]);
        const current = document.querySelectorAll('section')[1];
        const fake = createFakeMermaid();
        installFakeMermaid(fake);

        await manageMermaid(
            {},
            { getCurrentSlide: () => current as HTMLElement }
        );

        expect(fake.render.mock.calls.map(([, text]) => text)).toEqual([
            'current',
            'first',
        ]);
    });

    it('flags a diagram that fails and still renders the others', async () => {
        buildDeck('', [figure(0, 'bad'), figure(1, 'good')]);
        const fake = createFakeMermaid(async (id, text) => {
            if (text === 'bad') {
                throw new Error('Parse error on line 1');
            }
            return { svg: `<svg data-id="${id}"></svg>` };
        });
        installFakeMermaid(fake);

        await manageMermaid();

        const [bad, good] = Array.from(document.querySelectorAll('figure'));
        expect(bad.getAttribute('data-tc-mermaid-state')).toBe('error');
        expect(bad.querySelector('.tc-mermaid-error')?.textContent).toContain(
            'Parse error on line 1'
        );
        expect(bad.querySelector('svg')).toBeNull();
        expect(good.getAttribute('data-tc-mermaid-state')).toBe('rendered');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.error).mock.calls[0].join(' ')).toContain(
            'diagram 0'
        );
    });

    it('flags every diagram once, and keeps going, when Mermaid cannot be loaded', async () => {
        buildDeck('', [figure(0, 'A'), figure(1, 'B')]);
        loaderInternals!.setImporter(async () => {
            throw new Error('404');
        });

        await expect(manageMermaid()).resolves.toBeUndefined();

        for (const element of document.querySelectorAll('figure')) {
            expect(element.getAttribute('data-tc-mermaid-state')).toBe('error');
            expect(
                element.querySelector('.tc-mermaid-error')?.textContent
            ).toContain('vendor/');
        }
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.error).mock.calls[0][0]).toBeInstanceOf(
            TcVendorLoadError
        );
    });

    it('takes the font from --r-main-font unless the config sets one', async () => {
        buildDeck('', [figure(0, 'A')]);
        (document.querySelector('.reveal') as HTMLElement).style.setProperty(
            '--r-main-font',
            'Lato, sans-serif'
        );
        const fake = createFakeMermaid();
        installFakeMermaid(fake);

        await manageMermaid();
        expect(fake.initialize.mock.calls[0][0].fontFamily).toBe(
            'Lato, sans-serif'
        );

        buildDeck('', [figure(0, 'A')]);
        (document.querySelector('.reveal') as HTMLElement).style.setProperty(
            '--r-main-font',
            'Lato, sans-serif'
        );
        await manageMermaid({ config: { fontFamily: 'Mono' } });
        expect(fake.initialize.mock.calls[1][0].fontFamily).toBe('Mono');
    });

    describe('yielding to the browser', () => {
        async function renderOrder(reveal = {}): Promise<string[]> {
            buildDeck('', [figure(0, 'A'), figure(1, 'B')]);
            const events: string[] = [];
            installFakeMermaid(
                createFakeMermaid(async (id) => {
                    events.push('render');
                    return { svg: `<svg data-id="${id}"></svg>` };
                })
            );
            setTimeout(() => events.push('browser task'), 0);
            await manageMermaid({}, reveal);
            await new Promise((resolve) => setTimeout(resolve, 0));
            return events;
        }

        it('lets the browser run a task between two diagrams', async () => {
            expect(await renderOrder()).toEqual([
                'render',
                'browser task',
                'render',
            ]);
        });

        it('does not pause on paper, where nothing is displayed', async () => {
            const events = await renderOrder({
                getConfig: () => ({ view: 'print' }),
            });

            expect(events).toEqual(['render', 'render', 'browser task']);
        });
    });

    it('renders each diagram only once, however many times it is called', async () => {
        buildDeck('', [figure(0, 'A'), figure(1, 'B')]);
        const fake = createFakeMermaid();
        const importer = installFakeMermaid(fake);

        await Promise.all([manageMermaid(), manageMermaid()]);
        await manageMermaid();

        expect(fake.render).toHaveBeenCalledTimes(2);
        expect(importer).toHaveBeenCalledTimes(1);
    });
});
