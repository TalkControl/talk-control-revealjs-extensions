import { type Locator, type Page, expect, test } from '@playwright/test';

import { gotoSlide, waitForDeckReady } from './helpers';

/**
 * Issue #89: `full-center` does not render consistently on Firefox.
 *
 * Reproduction (step 1 of the implementation plan, see `.triage/phase2/89.md`)
 * measured `getBoundingClientRect()`/`getComputedStyle()` directly (both
 * browsers, several viewports) for every variant below, before writing this
 * test. Two distinct, confirmed root causes - both different from the
 * Bugzilla reports the plan started from, which turned out not to apply
 * here:
 *
 * 1. Container variants (`<div class="full-center">`, and the `<p>` that
 *    reveal's markdown plugin wraps around a lone image on a
 *    `.slide: class="full-center"` slide): `src/scss/theme/helpers/positions.scss`
 *    sized the absolutely-positioned container with `width: 100%; height: 100%`.
 *    That percentage has to resolve through the `<section>`'s own box, and
 *    Chromium and Firefox do not agree on the result: Chromium comes close to
 *    the full slide height, Firefox collapses the container down to the
 *    height of its in-flow content (the slide's headings), pinning the
 *    "centered" image near the top of the slide instead. The QR-code variant
 *    (`50_qrcodes.md`) is NOT affected: its `<p class="full-center">` sits one
 *    level deeper, inside the `tc-multiple-columns` markup, whose own box
 *    turns out to give that percentage chain a definite value in both
 *    browsers - this is why it was picked as the non-regression witness.
 * 2. The img-direct variant (`![](img 'full-center')`, class landing directly
 *    on the `<img>`): the img itself was `position: absolute; width: 100%;
 *    height: 100%`, which uses the default `object-fit: fill` and stretches
 *    the image to the slide's own aspect ratio - the ratio is NOT preserved,
 *    identically on both browsers (confirmed by direct measurement: a square
 *    300x300 image rendered non-square). A separate bug from (1).
 *
 * Fix (`positions.scss`): give the containers (case 1) an explicit size from
 * reveal.js's own `--slide-width`/`--slide-height` custom properties instead
 * of a percentage - same pattern already used by `resets.scss` for the
 * `.credits` fix (#90) - and, for the img-direct case (2), promote the
 * wrapping element to the absolutely-positioned, `display: grid` centering
 * box, leaving the image itself sized by `width/height: auto` capped by
 * `max-width`/`max-height` (so its own ratio is always preserved).
 */

interface RevealApi {
    isReady: () => boolean;
    slide: (h: number, v?: number) => void;
    getIndices: (slide: Element | null) => { h: number; v: number };
}

interface RevealFragmentApi {
    nextFragment: () => boolean;
}

function getRevealFragmentApi(page: Page) {
    return page.evaluateHandle(
        () => (window as unknown as { Reveal: RevealFragmentApi }).Reveal
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

interface Rect {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
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
            width: r.width,
            height: r.height,
        };
    });
}

interface ImgNaturalSize {
    naturalWidth: number;
    naturalHeight: number;
}

async function naturalSizeOf(locator: Locator): Promise<ImgNaturalSize> {
    return locator.evaluate((el) => {
        const img = el as HTMLImageElement;
        return {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
        };
    });
}

/** (a) the image's box is fully contained within the slide's box. */
function assertContained(img: Rect, slide: Rect, epsilon = 1): void {
    expect(img.left).toBeGreaterThanOrEqual(slide.left - epsilon);
    expect(img.top).toBeGreaterThanOrEqual(slide.top - epsilon);
    expect(img.right).toBeLessThanOrEqual(slide.right + epsilon);
    expect(img.bottom).toBeLessThanOrEqual(slide.bottom + epsilon);
}

/** (b) the image is centered on both axes, within ±1px. */
function assertCentered(img: Rect, slide: Rect, epsilon = 1): void {
    const imgCenterX = (img.left + img.right) / 2;
    const slideCenterX = (slide.left + slide.right) / 2;
    expect(Math.abs(imgCenterX - slideCenterX)).toBeLessThanOrEqual(epsilon);

    const imgCenterY = (img.top + img.bottom) / 2;
    const slideCenterY = (slide.top + slide.bottom) / 2;
    expect(Math.abs(imgCenterY - slideCenterY)).toBeLessThanOrEqual(epsilon);
}

/**
 * (c) the displayed ratio matches the image's natural ratio, within
 * `tolerance` (1% by default, per the acceptance criteria). The QR-code
 * variant uses a looser 2%: its generated image is capped by `h-500` through
 * a plain pixel height (no ratio-preserving CSS at all, by design - QR codes
 * are square), and sub-pixel rounding of that height alone is enough to
 * nudge the measured ratio a hair past 1%.
 */
function assertRatioPreserved(
    img: Rect,
    natural: ImgNaturalSize,
    tolerance = 0.01
): void {
    const naturalRatio = natural.naturalWidth / natural.naturalHeight;
    const displayedRatio = img.width / img.height;
    expect(
        Math.abs(displayedRatio - naturalRatio) / naturalRatio
    ).toBeLessThanOrEqual(tolerance);
}

/** (e) a small image is never enlarged beyond its own natural size. */
function assertNotEnlarged(
    img: Rect,
    natural: ImgNaturalSize,
    scale: number
): void {
    const epsilon = 1;
    expect(img.width).toBeLessThanOrEqual(
        natural.naturalWidth * scale + epsilon
    );
    expect(img.height).toBeLessThanOrEqual(
        natural.naturalHeight * scale + epsilon
    );
}

/**
 * The scale factor reveal.js applies between its logical slide size
 * (`Reveal.getConfig().width`/`height`, 1920x1080 for this demo, see
 * `src/theme-initializer.ts`) and actual on-screen device pixels, derived
 * from the measured slide box so the assertions do not hardcode it.
 */
function scaleFactorFor(slide: Rect, logicalSlideHeight: number): number {
    return slide.height / logicalSlideHeight;
}

const LOGICAL_SLIDE_HEIGHT = 1080;

test.describe('issue #89: full-center image centering', () => {
    test('div variant: <div class="full-center"><img></div>', async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, 'full-center-div');

        const slide = await rectOf(
            page.locator('.reveal .slides > section.present')
        );
        const img = page.locator('#full-center-div img');
        await expect(img).toBeVisible();
        const imgRect = await rectOf(img);
        const natural = await naturalSizeOf(img);

        assertContained(imgRect, slide);
        assertCentered(imgRect, slide);
        assertRatioPreserved(imgRect, natural);
        assertNotEnlarged(
            imgRect,
            natural,
            scaleFactorFor(slide, LOGICAL_SLIDE_HEIGHT)
        );
    });

    test('slide variant: <!-- .slide: class="full-center" --> + lone image', async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, 'full-center-slide');

        const slide = await rectOf(
            page.locator('.reveal .slides > section.present')
        );
        const img = page.locator('#full-center-slide img');
        await expect(img).toBeVisible();
        const imgRect = await rectOf(img);
        const natural = await naturalSizeOf(img);

        assertContained(imgRect, slide);
        assertCentered(imgRect, slide);
        assertRatioPreserved(imgRect, natural);
        assertNotEnlarged(
            imgRect,
            natural,
            scaleFactorFor(slide, LOGICAL_SLIDE_HEIGHT)
        );
    });

    test("img variant: ![](img 'full-center'), small image", async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, 'full-center-img');

        const slide = await rectOf(
            page.locator('.reveal .slides > section.present')
        );
        const img = page.locator('#full-center-img img.full-center');
        await expect(img).toBeVisible();
        const imgRect = await rectOf(img);
        const natural = await naturalSizeOf(img);

        assertContained(imgRect, slide);
        assertCentered(imgRect, slide);
        assertRatioPreserved(imgRect, natural);
        assertNotEnlarged(
            imgRect,
            natural,
            scaleFactorFor(slide, LOGICAL_SLIDE_HEIGHT)
        );
    });

    test("img variant: ![](img 'full-center'), large landscape image is capped", async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, 'full-center-img-landscape');

        const slide = await rectOf(
            page.locator('.reveal .slides > section.present')
        );
        const img = page.locator('#full-center-img-landscape img.full-center');
        await expect(img).toBeVisible();
        const imgRect = await rectOf(img);
        const natural = await naturalSizeOf(img);

        assertContained(imgRect, slide);
        assertCentered(imgRect, slide);
        assertRatioPreserved(imgRect, natural);
    });

    test("img variant: ![](img 'full-center'), large portrait image is capped", async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, 'full-center-img-portrait');

        const slide = await rectOf(
            page.locator('.reveal .slides > section.present')
        );
        const img = page.locator('#full-center-img-portrait img.full-center');
        await expect(img).toBeVisible();
        const imgRect = await rectOf(img);
        const natural = await naturalSizeOf(img);

        // The portrait image (1803x3524) is both taller and, once scaled to
        // the slide's height, would be wider than the slide: the real-world
        // case this variant exists for. Containment implies the ceiling held.
        assertContained(imgRect, slide);
        assertCentered(imgRect, slide);
        assertRatioPreserved(imgRect, natural);
    });

    test('QR code variant: non-regression, `tc-qrcode h-500 full-center`', async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, 'full-center-qrcode');

        const slide = await rectOf(
            page.locator('.reveal .slides > section.present')
        );
        const img = page.locator('#full-center-qrcode img.tc-qrcode').first();
        await expect(img).toBeVisible();
        const imgRect = await rectOf(img);
        const natural = await naturalSizeOf(img);

        // This slide lays the QR code out beside its text (`grid-template-areas:
        // 'img text'`), so it is not expected to be horizontally centered on
        // the slide - only contained, vertically centered, square (QR codes
        // are square) and still capped at its own `h-500`.
        assertContained(imgRect, slide);
        assertRatioPreserved(imgRect, natural, 0.02);

        const imgCenterY = (imgRect.top + imgRect.bottom) / 2;
        const slideCenterY = (slide.top + slide.bottom) / 2;
        expect(Math.abs(imgCenterY - slideCenterY)).toBeLessThanOrEqual(2);

        const scale = scaleFactorFor(slide, LOGICAL_SLIDE_HEIGHT);
        const expectedHeight = 500 * scale;
        expect(
            Math.abs(imgRect.height - expectedHeight) / expectedHeight
        ).toBeLessThanOrEqual(0.02);

        // The fragment-driven columns layout must still work: advancing
        // through the slide's fragments must not move or resize the image.
        const reveal = await getRevealFragmentApi(page);
        // eslint-disable-next-line no-empty
        while (await reveal.evaluate((api) => api.nextFragment())) {}
        const imgRectAfterFragments = await rectOf(img);
        expect(imgRectAfterFragments.height).toBeCloseTo(imgRect.height, 0);
        expect(imgRectAfterFragments.width).toBeCloseTo(imgRect.width, 0);
    });
});
