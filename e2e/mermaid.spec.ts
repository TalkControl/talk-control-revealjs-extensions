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
        await allRendered(page, 3);

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
        await allRendered(page, 3);

        // The slide is hidden: the SVG has no box yet, but Mermaid measured
        // the diagram at the deck size, so its viewBox is the real one.
        const last = page.locator(FIGURE).last().locator('svg');
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
        await allRendered(page, 3);

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
            await allRendered(page, 3);
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
        await allRendered(page, 3);

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
