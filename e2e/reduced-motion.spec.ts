import { type Page, expect, test } from '@playwright/test';

import { gotoSlide, waitForDeckReady } from './helpers';

/**
 * Issue #107: the theme must neutralize its own transitions and animations
 * once the user has asked for reduced motion
 * (`src/scss/theme/a11y/motion-contrast.scss`).
 *
 * The copy-to-clipboard icon (`src/scss/theme/classics/code-slides.scss`,
 * `.tc-copy-to-clipboard`) is used as the witness element: it is rendered on
 * every `with-code` slide by default (`activeCopyClipboard` defaults to
 * `true`, see `src/theme-plugin.ts`), so it needs no interaction to be
 * present and measurable, and it carries a real `transition: opacity 0.1s`
 * declaration from the theme itself (not from reveal.js core).
 */

interface RevealApi {
    getIndices: (slide: Element | null) => { h: number; v: number };
}

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
 * `transitionDuration` can list several comma-separated durations (one per
 * transitioned property, or just one if `transition` names no property
 * list). Any of them being non-zero would mean the reduced-motion override
 * did not reach that property, so the effective duration is their maximum.
 */
async function effectiveTransitionDurationSeconds(
    page: Page,
    selector: string
): Promise<number> {
    const raw = await page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).transitionDuration);
    return Math.max(...raw.split(',').map((value) => parseFloat(value)));
}

const WITNESS_SLIDE_ID = 'medium-code-highlight';
const WITNESS_SELECTOR = `#${WITNESS_SLIDE_ID} .tc-copy-to-clipboard`;

test.describe('prefers-reduced-motion: reduce (#107)', () => {
    test.use({ reducedMotion: 'reduce' });

    test('neutralizes the copy-to-clipboard icon transition', async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, WITNESS_SLIDE_ID);

        await expect(page.locator(WITNESS_SELECTOR).first()).toBeVisible();

        const duration = await effectiveTransitionDurationSeconds(
            page,
            WITNESS_SELECTOR
        );
        expect(duration).toBe(0);
    });
});

test.describe('control: no reduced-motion preference', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('keeps the default, non-zero transition duration (no visual regression)', async ({
        page,
    }) => {
        await page.goto('/index.html');
        await gotoSlideById(page, WITNESS_SLIDE_ID);

        await expect(page.locator(WITNESS_SELECTOR).first()).toBeVisible();

        const duration = await effectiveTransitionDurationSeconds(
            page,
            WITNESS_SELECTOR
        );
        expect(duration).toBeGreaterThan(0);
    });
});
