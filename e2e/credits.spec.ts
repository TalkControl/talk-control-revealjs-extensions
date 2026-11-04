import { type Locator, type Page, expect, test } from '@playwright/test';

import { gotoSlide, waitForDeckReady } from './helpers';

/**
 * Issue #90: on Firefox, a `<!-- .element: class="credits" -->` paragraph is
 * not anchored to the bottom of the slide, unlike on Chrome.
 *
 * Root cause (confirmed by direct measurement, see the PR description for the
 * full Chromium/Firefox table): `src/scss/theme/resets.scss` anchors
 * `p.credits` with `position: absolute; bottom: 0` relative to its own
 * `<section>`. That section is itself `position: absolute` with no explicit
 * `height` (reveal.js only sets `height: 100%` on the outer `.stack`
 * wrapper, never on an individual slide). With `height: auto`, Chromium and
 * Firefox disagree on how tall the box becomes once it contains an
 * absolutely-positioned, `bottom`-anchored descendant:
 *  - Chromium grows the section to (almost) the full slide height.
 *  - Firefox shrinks the section to the height of its in-flow content only.
 *
 * `p.credits` is correctly anchored to *its own section*'s bottom edge in
 * BOTH browsers (that part of the CSS works); the bug is that the section's
 * own height differs, so "bottom of the section" lands in very different
 * places on screen. This is why every geometric assertion below compares
 * `p.credits` against the *top-level present slide* (`.reveal .slides >
 * section.present`), not against its own (possibly collapsed) section.
 *
 * A dedicated slide with an explicit `style="height: 100%;"` (see
 * `#credits-explicit-height-control` below) proves the diagnosis: giving the
 * section an explicit height makes both browsers agree, with virtually no
 * gap at all. That slide is the test suite's positive control.
 */

const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 1024, height: 768 },
];

interface RevealApi {
    getIndices: (slide: Element | null) => { h: number; v: number };
    nextFragment: () => boolean;
}

function getRevealApi(page: Page) {
    return page.evaluateHandle(
        () => (window as unknown as { Reveal: RevealApi }).Reveal
    );
}

/** Navigate to the slide whose outer `<section>` carries the given id. */
async function gotoSlideById(page: Page, id: string): Promise<void> {
    await waitForDeckReady(page);
    const slide = page.locator(`#${id}`);
    await slide.waitFor({ state: 'attached' });
    const indices = await slide.evaluate((el) => {
        const api = (window as unknown as { Reveal: RevealApi }).Reveal;
        return api.getIndices(el);
    });
    await gotoSlide(page, indices.h, indices.v);
}

/**
 * Navigate to the slide containing a `p.credits` matching the given text.
 * Used for existing demo slides that predate this test and were not given a
 * dedicated id, so this PR does not have to touch their markdown.
 */
async function gotoSlideByCreditsText(
    page: Page,
    text: string
): Promise<Locator> {
    await waitForDeckReady(page);
    const paragraph = page.locator('p.credits', { hasText: text });
    await paragraph.waitFor({ state: 'attached' });
    const indices = await paragraph.evaluate((el) => {
        const api = (window as unknown as { Reveal: RevealApi }).Reveal;
        return api.getIndices(el.closest('section'));
    });
    await gotoSlide(page, indices.h, indices.v);
    return paragraph;
}

interface Rect {
    top: number;
    bottom: number;
    left: number;
    right: number;
    height: number;
}

async function rectOf(locator: Locator): Promise<Rect> {
    return locator.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return {
            top: r.top,
            bottom: r.bottom,
            left: r.left,
            right: r.right,
            height: r.height,
        };
    });
}

/**
 * Assert that `credits` is anchored to the bottom and horizontally centered
 * within `slide`, with no overflow.
 *
 * Tolerances are expressed relative to the slide height rather than as flat
 * pixel values: reveal.js renders every slide on a fixed virtual canvas and
 * scales it to the viewport, so a ratio stays meaningful across the three
 * tested viewports. 5% comfortably covers the ~3.7% gap measured on a
 * correctly anchored slide (reveal's own default margin) while staying far
 * below the 30%+ gap measured on a broken one.
 */
function assertAnchoredToSlideBottom(credits: Rect, slide: Rect): void {
    const maxBottomGap = slide.height * 0.05;
    const overflowEpsilon = 1;

    expect(slide.bottom - credits.bottom).toBeLessThanOrEqual(maxBottomGap);
    expect(slide.bottom - credits.bottom).toBeGreaterThanOrEqual(
        -overflowEpsilon
    );

    const creditsCenterX = (credits.left + credits.right) / 2;
    const slideCenterX = (slide.left + slide.right) / 2;
    expect(Math.abs(creditsCenterX - slideCenterX)).toBeLessThanOrEqual(2);

    expect(credits.left).toBeGreaterThanOrEqual(slide.left - overflowEpsilon);
    expect(credits.right).toBeLessThanOrEqual(slide.right + overflowEpsilon);
}

for (const viewport of VIEWPORTS) {
    test.describe(`viewport ${viewport.width}x${viewport.height}`, () => {
        test.use({ viewport });

        test('issue repro: with-code slide, fragments, credits (#90)', async ({
            page,
            browserName,
        }) => {
            test.fail(
                browserName === 'firefox',
                '#90: .credits is not anchored to the bottom of the slide on Firefox'
            );

            await page.goto('/index.html');
            await gotoSlideById(page, 'credits-firefox-repro');

            const slide = page.locator('.reveal .slides > section.present');
            const credits = page.locator('#credits-firefox-repro p.credits');

            await expect(credits).toBeVisible();
            assertAnchoredToSlideBottom(
                await rectOf(credits),
                await rectOf(slide)
            );

            // The assertion must still hold once every fragment is shown.
            const reveal = await getRevealApi(page);
            // eslint-disable-next-line no-empty
            while (await reveal.evaluate((api) => api.nextFragment())) {}

            assertAnchoredToSlideBottom(
                await rectOf(credits),
                await rectOf(slide)
            );
        });

        test('minimal repro: single paragraph + credits, no with-code, no fragments (#90)', async ({
            page,
            browserName,
        }) => {
            test.fail(
                browserName === 'firefox',
                '#90: the anchoring bug is not specific to fragments or the with-code class, ' +
                    'it reproduces on any slide whose section height is not explicit'
            );

            await page.goto('/index.html');
            await gotoSlideById(page, 'credits-minimal-repro');

            const slide = page.locator('.reveal .slides > section.present');
            const credits = page.locator('#credits-minimal-repro p.credits');

            await expect(credits).toBeVisible();
            assertAnchoredToSlideBottom(
                await rectOf(credits),
                await rectOf(slide)
            );
        });

        test('existing witness: transition slide with credits, no fragments', async ({
            page,
            browserName,
        }) => {
            test.fail(
                browserName === 'firefox',
                '#90: this pre-existing demo slide (shipped before this PR) hits the same ' +
                    'root cause as the reported case; it is not a case the fix can leave broken'
            );

            await page.goto('/index.html');
            const credits = await gotoSlideByCreditsText(page, 'Georgie Cobbs');

            const slide = page.locator('.reveal .slides > section.present');

            await expect(credits).toBeVisible();
            assertAnchoredToSlideBottom(
                await rectOf(credits),
                await rectOf(slide)
            );
        });

        test('control: explicit section height keeps credits anchored on both browsers', async ({
            page,
        }) => {
            await page.goto('/index.html');
            await gotoSlideById(page, 'credits-explicit-height-control');

            const slide = page.locator('.reveal .slides > section.present');
            const credits = page.locator(
                '#credits-explicit-height-control p.credits'
            );

            await expect(credits).toBeVisible();
            assertAnchoredToSlideBottom(
                await rectOf(credits),
                await rectOf(slide)
            );
        });
    });
}
