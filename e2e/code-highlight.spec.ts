import { type Page, expect, test } from '@playwright/test';

import { waitForDeckReady } from './helpers';

/**
 * Reproduction for issue #88: in a `big-code` slide, once the highlighted
 * code block is taller than the slide itself, reveal.js's highlight plugin
 * never gets a chance to scroll/center the highlighted lines, because the
 * `<code>` box simply overflows the slide instead of scrolling internally.
 *
 * Manual reproduction (step 0 of the implementation plan, see
 * `.triage/phase2/88.md`) confirmed the hypothesis in both Chromium and
 * Firefox, at every tested viewport: for the "big-code-highlight" demo slide,
 * `code.scrollHeight === code.offsetHeight` (no internal overflow at all) and
 * `code.offsetHeight` is greater than the available slide height, so the
 * block spills out of the deck's visible viewport.
 *
 * One deviation from the written plan: comparing the `<code>` box against its
 * parent `<section>` is not a reliable cross-browser signal. When a slide's
 * content is taller than the configured slide height, Chromium keeps the
 * `<section>` clamped to the slide's own box (so the code box measurably
 * overflows it), but Firefox lets the `<section>` grow to wrap the
 * oversized content (so the code box appears to "fit" inside its own
 * inflated parent). `.reveal-viewport` (`overflow: hidden`, `height: 100%`)
 * is the element reveal.js actually uses to clip the visible deck area in
 * both browsers, so it is used here as the stable reference instead.
 */

interface RevealNavigationApi {
    getIndices: (slide?: Element) => { h: number; v: number; f?: number };
    nextFragment: () => boolean;
}

const BIG_CODE_SLIDE_ID = 'big-code-highlight';
const MEDIUM_CODE_SLIDE_ID = 'medium-code-highlight';
const ALONE_CODE_SLIDE_ID = 'big-code-alone';

// The demo slides declare 3 highlight steps: `[1-6|8-11|13-16]`.
const HIGHLIGHT_STEP_COUNT = 3;

const VIEWPORTS = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1280x720', width: 1280, height: 720 },
    { name: '1024x768 (non 16:9)', width: 1024, height: 768 },
];

interface CodeBlockMeasurement {
    viewportRect: { top: number; bottom: number };
    codeRect: { top: number; bottom: number };
    scrollHeight: number;
    clientHeight: number;
    highlightCenter: number | null;
    codeCenter: number;
    lineHeight: number;
}

/**
 * Navigate to a demo slide by its stable `id`, resolving the horizontal and
 * vertical indices through the public Reveal.js API so the test does not
 * depend on the slide's position in the deck.
 */
async function gotoSlideById(page: Page, slideId: string): Promise<void> {
    await waitForDeckReady(page);
    await page.evaluate((id) => {
        const section = document.getElementById(id);
        if (!section) {
            throw new Error(`Demo slide "#${id}" was not found in the deck.`);
        }
        const reveal = window.Reveal as unknown as typeof window.Reveal &
            RevealNavigationApi;
        const { h, v } = reveal.getIndices(section);
        reveal.slide(h, v);
    }, slideId);

    await page.waitForFunction(
        (id) => document.getElementById(id)?.classList.contains('present'),
        slideId
    );
}

/** Advance the currently visible highlight step by one. */
async function advanceHighlight(page: Page): Promise<void> {
    await page.evaluate(() => {
        const reveal = window.Reveal as unknown as typeof window.Reveal &
            RevealNavigationApi;
        reveal.nextFragment();
    });
}

/**
 * Both browser-side callbacks below (`waitForScrollToSettle` and
 * `measureActiveHighlightedCodeBlock`) independently resolve "the code block
 * currently on screen" for a slide using stepped line-highlighting, by the
 * same logic, duplicated rather than shared: `page.evaluate` /
 * `page.waitForFunction` only ship the single function they are given into
 * the browser context, so they cannot call back into a Node-defined helper.
 *
 * reveal.js's highlight plugin clones the original `<code>` block once per
 * extra step and marks the one currently being shown with
 * `.current-fragment`; before any fragment has been shown, the original
 * (non-cloned) block — which never carries the `.fragment` class — is the
 * one visible. The `.current-fragment` lookup MUST be tried first: the
 * original block still matches `:not(.fragment)` even once a later fragment
 * has become current.
 */

/**
 * Wait until the active code block's `scrollTop` has stopped moving, so that
 * reveal.js's highlight-centering animation (requestAnimationFrame-based,
 * not a CSS transition) has settled before we measure anything.
 */
async function waitForScrollToSettle(
    page: Page,
    slideId: string
): Promise<void> {
    await page.evaluate(() => {
        delete (window as unknown as Record<string, unknown>).__tcScrollSettle;
    });

    await page.waitForFunction(
        (id) => {
            const section = document.getElementById(id);
            if (!section) return false;
            const code =
                section.querySelector<HTMLElement>(
                    'code[data-line-numbers].current-fragment'
                ) ??
                section.querySelector<HTMLElement>(
                    'code[data-line-numbers]:not(.fragment)'
                );
            if (!code) return false;

            const w = window as unknown as {
                __tcScrollSettle?: { value: number; streak: number };
            };
            const current = code.scrollTop;
            const previous = w.__tcScrollSettle;
            const streak =
                previous && previous.value === current
                    ? previous.streak + 1
                    : 1;
            w.__tcScrollSettle = { value: current, streak };

            // Require 3 consecutive identical reads before considering the
            // scroll position stable.
            return streak >= 3;
        },
        slideId,
        { polling: 50, timeout: 5_000 }
    );
}

async function measureActiveHighlightedCodeBlock(
    page: Page,
    slideId: string
): Promise<CodeBlockMeasurement> {
    await waitForScrollToSettle(page, slideId);

    return page.evaluate((id) => {
        const section = document.getElementById(id);
        const viewport = document.querySelector('.reveal-viewport');
        const code =
            section?.querySelector<HTMLElement>(
                'code[data-line-numbers].current-fragment'
            ) ??
            section?.querySelector<HTMLElement>(
                'code[data-line-numbers]:not(.fragment)'
            );
        if (!viewport || !code) {
            throw new Error(
                `No active highlighted code block found on slide "#${id}".`
            );
        }

        const highlightedLines =
            code.querySelectorAll<HTMLElement>('.highlight-line');
        const viewportRect = viewport.getBoundingClientRect();
        const codeRect = code.getBoundingClientRect();
        const lineHeight = parseFloat(getComputedStyle(code).lineHeight);

        let highlightCenter: number | null = null;
        if (highlightedLines.length > 0) {
            const first = highlightedLines[0].getBoundingClientRect();
            const last =
                highlightedLines[
                    highlightedLines.length - 1
                ].getBoundingClientRect();
            highlightCenter = (first.top + last.bottom) / 2;
        }

        return {
            viewportRect: {
                top: viewportRect.top,
                bottom: viewportRect.bottom,
            },
            codeRect: { top: codeRect.top, bottom: codeRect.bottom },
            scrollHeight: code.scrollHeight,
            clientHeight: code.clientHeight,
            highlightCenter,
            codeCenter: (codeRect.top + codeRect.bottom) / 2,
            lineHeight,
        };
    }, slideId);
}

async function measureAloneCodeBlock(
    page: Page,
    slideId: string
): Promise<
    Omit<CodeBlockMeasurement, 'highlightCenter' | 'codeCenter' | 'lineHeight'>
> {
    return page.evaluate((id) => {
        const section = document.getElementById(id);
        const viewport = document.querySelector('.reveal-viewport');
        const code = section?.querySelector<HTMLElement>('pre code');
        if (!section || !viewport || !code) {
            throw new Error(`No code block found on slide "#${id}".`);
        }

        const viewportRect = viewport.getBoundingClientRect();
        const codeRect = code.getBoundingClientRect();

        return {
            viewportRect: {
                top: viewportRect.top,
                bottom: viewportRect.bottom,
            },
            codeRect: { top: codeRect.top, bottom: codeRect.bottom },
            scrollHeight: code.scrollHeight,
            clientHeight: code.clientHeight,
        };
    }, slideId);
}

// Tolerance for sub-pixel rounding differences between browsers.
const RECT_TOLERANCE_PX = 1;

test.describe('big-code highlight centering (issue #88 reproduction)', () => {
    for (const viewport of VIEWPORTS) {
        test(`highlighted lines stay centered within the slide at ${viewport.name}`, async ({
            page,
        }) => {
            await page.setViewportSize({
                width: viewport.width,
                height: viewport.height,
            });
            await page.goto('/index.html?transition=none');
            await gotoSlideById(page, BIG_CODE_SLIDE_ID);

            for (let step = 0; step < HIGHLIGHT_STEP_COUNT; step += 1) {
                if (step > 0) {
                    await advanceHighlight(page);
                }

                const measurement = await measureActiveHighlightedCodeBlock(
                    page,
                    BIG_CODE_SLIDE_ID
                );

                // 1. The <code> box must stay within the deck's visible viewport.
                expect(measurement.codeRect.top).toBeGreaterThanOrEqual(
                    measurement.viewportRect.top - RECT_TOLERANCE_PX
                );
                expect(measurement.codeRect.bottom).toBeLessThanOrEqual(
                    measurement.viewportRect.bottom + RECT_TOLERANCE_PX
                );

                // 2. The block must have an internal overflow for reveal's
                // highlight plugin to be able to scroll/center anything.
                expect(measurement.scrollHeight).toBeGreaterThan(
                    measurement.clientHeight
                );

                // 3. Away from the scroll boundaries (first and last step),
                // the highlighted lines are centered in the visible code box,
                // within one line height.
                const isBoundaryStep =
                    step === 0 || step === HIGHLIGHT_STEP_COUNT - 1;
                if (!isBoundaryStep) {
                    expect(measurement.highlightCenter).not.toBeNull();
                    expect(
                        Math.abs(
                            (measurement.highlightCenter as number) -
                                measurement.codeCenter
                        )
                    ).toBeLessThanOrEqual(measurement.lineHeight);
                }
            }
        });
    }
});

test.describe('medium-code highlight centering (non-regression)', () => {
    for (const viewport of VIEWPORTS) {
        test(`fits without overflow at ${viewport.name}`, async ({ page }) => {
            await page.setViewportSize({
                width: viewport.width,
                height: viewport.height,
            });
            await page.goto('/index.html?transition=none');
            await gotoSlideById(page, MEDIUM_CODE_SLIDE_ID);

            for (let step = 0; step < HIGHLIGHT_STEP_COUNT; step += 1) {
                if (step > 0) {
                    await advanceHighlight(page);
                }

                const measurement = await measureActiveHighlightedCodeBlock(
                    page,
                    MEDIUM_CODE_SLIDE_ID
                );

                expect(measurement.scrollHeight).toBeLessThanOrEqual(
                    measurement.clientHeight
                );
                expect(measurement.codeRect.top).toBeGreaterThanOrEqual(
                    measurement.viewportRect.top - RECT_TOLERANCE_PX
                );
                expect(measurement.codeRect.bottom).toBeLessThanOrEqual(
                    measurement.viewportRect.bottom + RECT_TOLERANCE_PX
                );
            }
        });
    }
});

test.describe('big-code "alone" positioning (non-regression)', () => {
    for (const viewport of VIEWPORTS) {
        test(`stays within the deck viewport at ${viewport.name}`, async ({
            page,
        }) => {
            await page.setViewportSize({
                width: viewport.width,
                height: viewport.height,
            });
            await page.goto('/index.html?transition=none');
            await gotoSlideById(page, ALONE_CODE_SLIDE_ID);

            const measurement = await measureAloneCodeBlock(
                page,
                ALONE_CODE_SLIDE_ID
            );

            expect(measurement.scrollHeight).toBeLessThanOrEqual(
                measurement.clientHeight
            );
            expect(measurement.codeRect.top).toBeGreaterThanOrEqual(
                measurement.viewportRect.top - RECT_TOLERANCE_PX
            );
            expect(measurement.codeRect.bottom).toBeLessThanOrEqual(
                measurement.viewportRect.bottom + RECT_TOLERANCE_PX
            );
        });
    }
});
