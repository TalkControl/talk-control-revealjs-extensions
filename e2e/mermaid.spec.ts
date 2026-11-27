import { type Page, expect, test } from '@playwright/test';
import http, { type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { type AddressInfo } from 'node:net';
import path from 'node:path';

import { waitForDeckReady } from './helpers';

/**
 * Mermaid diagrams (#92), end to end on the real demo and on two small
 * fixtures (UMD build, deck hosted under a nested path).
 */

const FIGURE = '.reveal .slides figure[data-tc-mermaid]';
const MERMAID_REQUEST = /\/vendor\/mermaid\//;
// Mermaid is split in many chunks, but only the ones the diagrams need are
// fetched: stay far below the ~100 files shipped (contract test).
const MAX_MERMAID_REQUESTS = 60;

async function allRendered(page: Page, expected: number): Promise<void> {
    await expect(page.locator(FIGURE)).toHaveCount(expected);
    await expect(
        page.locator(`${FIGURE}[data-tc-mermaid-state="rendered"]`)
    ).toHaveCount(expected, { timeout: 30_000 });
}

function trackMermaidRequests(page: Page): string[] {
    const urls: string[] = [];
    page.on('request', (request) => {
        if (MERMAID_REQUEST.test(request.url())) urls.push(request.url());
    });
    return urls;
}

test.describe('in the demo', () => {
    test('renders every diagram as an SVG, with no console error', async ({
        page,
    }) => {
        const errors: string[] = [];
        page.on(
            'console',
            (m) => m.type() === 'error' && errors.push(m.text())
        );
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto('/index.html?data-type=helpers');
        await waitForDeckReady(page);
        await allRendered(page, 4);

        for (const figure of await page.locator(FIGURE).all()) {
            await expect(figure.locator('svg')).toHaveCount(1);
            await expect(figure.locator('.tc-mermaid-source')).toBeHidden();
        }
        expect(errors).toEqual([]);
    });

    test('a diagram on a slide not visited yet has a real size', async ({
        page,
    }) => {
        await page.goto('/index.html?data-type=helpers');
        await waitForDeckReady(page);
        await allRendered(page, 4);

        // The slide is hidden: the SVG has no box yet, but Mermaid measured
        // the diagram at the deck size, so its viewBox is the real one.
        const last = page.locator(FIGURE).nth(1).locator('svg');
        const viewBox = await last.getAttribute('viewBox');
        const [, , width, height] = (viewBox ?? '').split(/\s+/).map(Number);
        expect(width).toBeGreaterThan(50);
        expect(height).toBeGreaterThan(50);

        // Once shown, the diagram fits the slide and is not collapsed.
        await last.evaluate((svg) => {
            const slide = svg.closest('.slides > section, .slides section');
            const reveal = (
                window as unknown as {
                    Reveal: {
                        getIndices: (s: Element) => { h: number; v: number };
                        slide: (h: number, v: number) => void;
                    };
                }
            ).Reveal;
            const { h, v } = reveal.getIndices(slide as Element);
            reveal.slide(h, v);
        });
        await expect(last).toBeVisible();
        const box = await last.boundingBox();
        expect(box!.width).toBeGreaterThan(50);
        expect(box!.height).toBeGreaterThan(50);
    });

    test('a diagram animated as a fragment shows up on the next step', async ({
        page,
    }) => {
        await page.goto('/index.html?data-type=helpers');
        await waitForDeckReady(page);
        await allRendered(page, 4);

        const fragment = page.locator(`${FIGURE}.fade-up`);
        await fragment.evaluate((el) => {
            const slide = el.closest('section') as Element;
            const { h, v } = (
                window as unknown as {
                    Reveal: {
                        getIndices: (s: Element) => { h: number; v: number };
                    };
                }
            ).Reveal.getIndices(slide);
            (
                window as unknown as {
                    Reveal: { slide: (h: number, v: number) => void };
                }
            ).Reveal.slide(h, v);
        });
        await expect(fragment).not.toHaveClass(/visible/);
        await page.keyboard.press('ArrowRight');
        await expect(fragment).toHaveClass(/visible/);
    });

    test('the Mermaid theme follows the deck theme', async ({ page }) => {
        // Two full loads of the deck, each with its diagrams to draw.
        test.setTimeout(90_000);
        const fillOf = async (theme: string) => {
            await page.goto(
                `/index.html?data-type=helpers&data-theme=${theme}`
            );
            await waitForDeckReady(page);
            await allRendered(page, 4);
            return page
                .locator(FIGURE)
                .first()
                .locator('svg')
                .evaluate((svg) => {
                    const node = svg.querySelector('.node rect, .node path');
                    return node ? getComputedStyle(node).fill : '';
                });
        };
        const light = await fillOf('tc');
        const dark = await fillOf('dark');
        expect(light).not.toBe('');
        expect(dark).not.toBe('');
        expect(dark).not.toBe(light);
    });

    test('a deck without a diagram never requests Mermaid', async ({
        page,
    }) => {
        const requests = trackMermaidRequests(page);
        await page.goto('/index.html?data-type=tools');
        await waitForDeckReady(page);
        await page.waitForTimeout(1000);

        await expect(page.locator(FIGURE)).toHaveCount(0);
        expect(requests).toEqual([]);
    });

    test('a deck with diagrams loads Mermaid on demand, within limits', async ({
        page,
    }) => {
        const requests = trackMermaidRequests(page);
        await page.goto('/index.html?data-type=helpers');
        await waitForDeckReady(page);
        await allRendered(page, 4);

        const entry = requests.filter((u) =>
            u.endsWith('/vendor/mermaid/dist/mermaid.esm.min.mjs')
        );
        expect(entry).toHaveLength(1);
        expect(requests.length).toBeLessThanOrEqual(MAX_MERMAID_REQUESTS);
    });

    test('print-pdf: every diagram is in the slides before the pagination', async ({
        page,
    }) => {
        await page.goto('/index.html?data-type=helpers&print-pdf');
        await waitForDeckReady(page);

        // reveal.js may repeat a slide per fragment step in the PDF: count
        // what is in the pages, do not assume one figure per diagram.
        const figures = page.locator(
            '.reveal .slides .pdf-page figure[data-tc-mermaid]'
        );
        await expect
            .poll(() => figures.count(), { timeout: 30_000 })
            .toBeGreaterThanOrEqual(3);
        const total = await figures.count();
        await expect(
            page.locator(
                '.reveal .slides .pdf-page figure[data-tc-mermaid][data-tc-mermaid-state="rendered"] svg'
            )
        ).toHaveCount(total);
    });
});

test.describe('size and zoom', () => {
    const SLIDE_HEIGHT = 1080;

    /** Show the slide of the diagram that has this class (or none: the first). */
    async function show(page: Page, diagramClass?: string) {
        const figure = diagramClass
            ? page.locator(FIGURE).filter({
                  has: page.locator(`.tc-mermaid-diagram.${diagramClass}`),
              })
            : page.locator(FIGURE).first();
        const svg = figure.first().locator('svg');
        await svg.evaluate((el) => {
            const reveal = (
                window as unknown as {
                    Reveal: {
                        getIndices: (s: Element) => { h: number; v: number };
                        slide: (h: number, v: number) => void;
                    };
                }
            ).Reveal;
            const slide = el.closest('.slides section') as Element;
            const { h, v } = reveal.getIndices(slide);
            reveal.slide(h, v);
        });
        await expect(svg).toBeVisible();
        return { svg, diagram: figure.first().locator('.tc-mermaid-diagram') };
    }

    /** Screen pixels per user unit of the drawing (1 = natural size). */
    const drawingScale = (svg: import('@playwright/test').Locator) =>
        svg.evaluate((el) => (el as SVGSVGElement).getScreenCTM()!.a);

    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html?data-type=helpers');
        await waitForDeckReady(page);
        await allRendered(page, 4);
    });

    test('a diagram is drawn bigger than its natural size by default', async ({
        page,
    }) => {
        const { svg } = await show(page);
        const slideScale = page.viewportSize()!.height / SLIDE_HEIGHT;

        // A small flowchart is at least 1.5 times its natural size on the
        // slide (it used to stay at 1: unreadable on a screen).
        expect((await drawingScale(svg)) / slideScale).toBeGreaterThan(1.5);
    });

    test('an h-* class still decides the height of the diagram', async ({
        page,
    }) => {
        // Same slide scale for both boxes: compare them, not absolute pixels.
        const fitted = (await (await show(page)).diagram.boundingBox())!;
        const sized = (await (
            await show(page, 'h-400')
        ).diagram.boundingBox())!;

        // Default box: 1080 - 340 = 740 slide px; `h-400`: 400.
        expect(sized.height / fitted.height).toBeCloseTo(400 / 740, 2);
    });

    test('a zoomed diagram grows downward and never over the text above it', async ({
        page,
    }) => {
        const { diagram, svg } = await show(page, 'zoom-150');

        const box = (await diagram.boundingBox())!;
        const drawing = (await svg.boundingBox())!;
        // Scaled from the top edge: the top of the drawing stays where the
        // box starts, the extra height goes below.
        expect(drawing.y).toBeGreaterThanOrEqual(box.y - 1);
        expect(drawing.y + drawing.height).toBeGreaterThan(box.y + box.height);
    });

    test('a zoom-* class scales the drawing', async ({ page }) => {
        const { diagram, svg } = await show(page, 'zoom-150');

        expect(
            await diagram.evaluate((el) =>
                getComputedStyle(el).getPropertyValue('--tc-mermaid-zoom')
            )
        ).toBe('1.5');
        const flat = (await diagram.boundingBox())!;
        const zoomed = (await svg.boundingBox())!;
        // The SVG box is the diagram box, scaled by the zoom.
        expect(zoomed.width / flat.width).toBeCloseTo(1.5, 1);
    });
});

test.describe('on a hosted fixture', () => {
    const ROOT = process.cwd();
    const PREFIX = '/decks/42/';
    const MIME: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.cjs': 'text/javascript',
        '.css': 'text/css',
        '.md': 'text/markdown',
        '.json': 'application/json',
        '.map': 'application/json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
    };
    let server: Server;
    let origin: string;

    test.beforeAll(async () => {
        server = http.createServer(async (req, res) => {
            const { pathname } = new URL(req.url ?? '/', 'http://localhost');
            let file: string | undefined;
            if (pathname.startsWith(`${PREFIX}web_modules/`)) {
                file = path.join(
                    ROOT,
                    'dist',
                    pathname.slice(`${PREFIX}web_modules/`.length)
                );
            } else if (pathname.startsWith(PREFIX)) {
                file = path.join(
                    ROOT,
                    'fixtures/mermaid',
                    pathname.slice(PREFIX.length)
                );
            }
            try {
                if (!file || !(await stat(file)).isFile()) throw new Error();
                res.writeHead(200, {
                    'content-type':
                        MIME[path.extname(file)] ?? 'application/octet-stream',
                });
                res.end(await readFile(file));
            } catch {
                res.writeHead(404).end();
            }
        });
        await new Promise<void>((resolve) =>
            server.listen(0, '127.0.0.1', resolve)
        );
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    test.afterAll(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    for (const [name, page] of [
        ['ESM, deck hosted under a nested path', 'esm.html'],
        ['UMD build (classic script)', 'umd.html'],
    ]) {
        test(`Mermaid is found next to the library: ${name}`, async ({
            page: tab,
        }) => {
            const requests = trackMermaidRequests(tab);
            const failures: string[] = [];
            tab.on('requestfailed', (r) => failures.push(r.url()));
            tab.on(
                'response',
                (r) => r.status() >= 400 && failures.push(r.url())
            );

            await tab.goto(`${origin}${PREFIX}${page}`);
            await waitForDeckReady(tab);
            await allRendered(tab, 1);

            expect(requests.length).toBeGreaterThan(0);
            for (const url of requests) {
                expect(
                    url.startsWith(`${origin}${PREFIX}web_modules/vendor/`)
                ).toBe(true);
            }
            expect(failures).toEqual([]);
        });
    }
});
