import { type Page, expect, test } from '@playwright/test';

import { waitForDeckReady } from './helpers';

/**
 * Issue #106: the configurator dialog (opened with the `C` key, or now also
 * via the visible `#tc-configurator-trigger` button) had no focus trap, no
 * `inert`/focus-management on the rest of the page, and no visible entry
 * point. It also had a redundant `@keydown` handler on its close button that
 * duplicated the native `<button>` behavior for Enter/Space.
 *
 * This file is the automated version of the acceptance criteria:
 *  - `C` opens the dialog.
 *  - Tab cycles within it - it never escapes to the rest of the page.
 *  - Escape closes it, and focus returns to the triggering element.
 *  - The rest of the page is `inert` while the dialog is open.
 *  - A single Enter/Space press on the close button closes the dialog
 *    exactly once (no duplicate handler).
 *
 * Tab containment is asserted structurally (every tab stop is a descendant
 * of `tc-configurator-element`, walking through nested shadow roots:
 * `tc-talk-control-element` -> `tc-tree-slides-element`, etc.) rather than by
 * relying on what happens when Tab is pressed past the last/first focusable
 * element - that boundary behavior (whether focus exits to browser chrome)
 * is not something Chromium/Firefox automation exposes the same way, so the
 * dialog wraps focus itself instead of depending on it.
 */

const TRIGGER_SELECTOR = '#tc-configurator-trigger';
const DIALOG_SELECTOR = 'tc-configurator-element [role="dialog"]';
const CLOSE_BUTTON_SELECTOR =
    'tc-configurator-element #ui-slide-selector-close';

/**
 * `document.activeElement`, resolved through nested shadow roots, reported
 * as a small descriptor usable in assertions (id when present, else the tag
 * name).
 */
async function getDeepActiveElementDescriptor(page: Page): Promise<string> {
    return page.evaluate(() => {
        let active: Element | null = document.activeElement;
        while (active?.shadowRoot?.activeElement) {
            active = active.shadowRoot.activeElement;
        }
        if (!active) return 'null';
        return active.id || active.tagName;
    });
}

/**
 * Whether the currently (deeply) focused element lives inside
 * `tc-configurator-element`'s composed tree.
 */
async function isFocusInsideDialog(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        let active: Element | null = document.activeElement;
        while (active?.shadowRoot?.activeElement) {
            active = active.shadowRoot.activeElement;
        }

        let node: Node | null = active;
        while (node) {
            if (
                node instanceof Element &&
                node.tagName === 'TC-CONFIGURATOR-ELEMENT'
            ) {
                return true;
            }
            const root = node.getRootNode();
            node = root instanceof ShadowRoot ? root.host : node.parentNode;
            if (node === document) return false;
        }
        return false;
    });
}

test.describe('Configurator dialog accessibility (issue #106)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html');
        await waitForDeckReady(page);
    });

    test('has a visible, keyboard-reachable entry point', async ({ page }) => {
        const trigger = page.locator(TRIGGER_SELECTOR);

        await expect(trigger).toBeVisible();
        await expect(trigger).toHaveAttribute('aria-label', /configurator/i);
        await expect(trigger).not.toHaveAttribute('tabindex', '-1');
    });

    test('"C" opens the dialog, Escape closes it', async ({ page }) => {
        const dialog = page.locator(DIALOG_SELECTOR);
        await expect(dialog).toBeHidden();

        await page.keyboard.press('c');
        await expect(dialog).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });

    test('the visible trigger opens the dialog and focus returns to it on close', async ({
        page,
    }) => {
        const trigger = page.locator(TRIGGER_SELECTOR);
        const dialog = page.locator(DIALOG_SELECTOR);

        await trigger.focus();
        await page.keyboard.press('Enter');
        await expect(dialog).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();

        await expect(trigger).toBeFocused();
    });

    test('rest of the page is inert while the dialog is open, and is restored on close', async ({
        page,
    }) => {
        const reveal = page.locator('.reveal');
        const dialog = page.locator(DIALOG_SELECTOR);

        await expect(reveal).not.toHaveAttribute('inert', '');

        await page.keyboard.press('c');
        await expect(dialog).toBeVisible();
        await expect(reveal).toHaveAttribute('inert', '');

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(reveal).not.toHaveAttribute('inert', '');
    });

    test('Tab never escapes the dialog to the rest of the page', async ({
        page,
    }) => {
        const dialog = page.locator(DIALOG_SELECTOR);
        await page.keyboard.press('c');
        await expect(dialog).toBeVisible();

        // Enough presses to cycle through every tab stop (close button, the
        // two tabs, the talk-control panel's nested controls, apply button)
        // more than once, in both directions.
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Tab');
            expect(
                await isFocusInsideDialog(page),
                `Tab #${i + 1} (forward) moved focus outside the dialog (now on ${await getDeepActiveElementDescriptor(page)})`
            ).toBe(true);
        }

        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Shift+Tab');
            expect(
                await isFocusInsideDialog(page),
                `Shift+Tab #${i + 1} (backward) moved focus outside the dialog (now on ${await getDeepActiveElementDescriptor(page)})`
            ).toBe(true);
        }
    });

    test('close button fires exactly one close per Enter press (no duplicate handler)', async ({
        page,
    }) => {
        const dialog = page.locator(DIALOG_SELECTOR);
        const closeButton = page.locator(CLOSE_BUTTON_SELECTOR);

        await page.keyboard.press('c');
        await expect(dialog).toBeVisible();

        await page.evaluate(() => {
            const configurator = document.querySelector(
                'tc-configurator-element'
            )!;
            (window as unknown as { __tcCloseCount: number }).__tcCloseCount =
                0;
            configurator.addEventListener('close-ui', () => {
                (window as unknown as { __tcCloseCount: number })
                    .__tcCloseCount++;
            });
        });

        await closeButton.focus();
        await page.keyboard.press('Enter');
        await expect(dialog).toBeHidden();

        const closeCount = await page.evaluate(
            () =>
                (window as unknown as { __tcCloseCount: number }).__tcCloseCount
        );
        expect(closeCount).toBe(1);
    });

    test('close button fires exactly one close per Space press (no duplicate handler)', async ({
        page,
    }) => {
        const dialog = page.locator(DIALOG_SELECTOR);
        const closeButton = page.locator(CLOSE_BUTTON_SELECTOR);

        await page.keyboard.press('c');
        await expect(dialog).toBeVisible();

        await page.evaluate(() => {
            const configurator = document.querySelector(
                'tc-configurator-element'
            )!;
            (window as unknown as { __tcCloseCount: number }).__tcCloseCount =
                0;
            configurator.addEventListener('close-ui', () => {
                (window as unknown as { __tcCloseCount: number })
                    .__tcCloseCount++;
            });
        });

        await closeButton.focus();
        await page.keyboard.press(' ');
        await expect(dialog).toBeHidden();

        const closeCount = await page.evaluate(
            () =>
                (window as unknown as { __tcCloseCount: number }).__tcCloseCount
        );
        expect(closeCount).toBe(1);
    });
});
