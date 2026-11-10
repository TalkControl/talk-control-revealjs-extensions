import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { waitForDeckReady } from './helpers';

/**
 * Targeted a11y regression test for issue #103: the slide-selection tree
 * (`tc-tree-slides-element`) and the shortcuts table (`tc-revealjs-element`)
 * must not regress on checkbox/list naming (`label`) or ARIA table
 * structure (`aria-required-children`), independently of the broader
 * `talk-control-a11y` CLI baseline.
 */
const SHELL_ROOT_SELECTOR = '#ui-slide-selector';

test('slide tree: zero label violations, nested groups correctly named', async ({
    page,
}) => {
    await page.goto('/index.html');
    await waitForDeckReady(page);

    await page.keyboard.press('c');
    await page.locator(SHELL_ROOT_SELECTOR).waitFor({ state: 'visible' });

    const results = await new AxeBuilder({ page })
        .include(SHELL_ROOT_SELECTOR)
        .withRules(['label', 'aria-required-children'])
        .analyze();

    const labelViolations = results.violations.filter(
        (violation) => violation.id === 'label'
    );

    expect(labelViolations).toEqual([]);
    expect(results.violations).toEqual([]);
});

test('shortcuts table: zero aria-required-children violations once the RevealJS tab is shown', async ({
    page,
}) => {
    await page.goto('/index.html');
    await waitForDeckReady(page);

    await page.keyboard.press('c');
    await page.locator(SHELL_ROOT_SELECTOR).waitFor({ state: 'visible' });
    await page.getByRole('tab', { name: 'RevealJS' }).click();
    await page
        .locator(SHELL_ROOT_SELECTOR)
        .locator('[role="table"]')
        .waitFor({ state: 'visible' });

    const results = await new AxeBuilder({ page })
        .include(SHELL_ROOT_SELECTOR)
        .withRules(['label', 'aria-required-children'])
        .analyze();

    expect(results.violations).toEqual([]);
});
