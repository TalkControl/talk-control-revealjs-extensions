/**
 * @vitest-environment jsdom
 */
import './tc-tree-slides-element';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SlideTreeEntry } from '../models';
import { TcTreeSlidesElement } from './tc-tree-slides-element';

const SLIDES: SlideTreeEntry[] = [
    { prefix: '', path: 'intro.md', index: 0, check: true },
    {
        prefix: 'chapter-1',
        path: 'chapter-1/slide-1.md',
        index: 1,
        check: true,
    },
    {
        prefix: 'chapter-1',
        path: 'chapter-1/slide-2.md',
        index: 2,
        check: false,
    },
    {
        prefix: 'chapter-2',
        path: 'chapter-2/slide-1.md',
        index: 3,
        check: false,
    },
];

async function renderTree(
    slides: SlideTreeEntry[]
): Promise<TcTreeSlidesElement> {
    const element = document.createElement(
        'tc-tree-slides-element'
    ) as TcTreeSlidesElement;
    element.slides = slides;
    document.body.appendChild(element);
    await element.updateComplete;
    return element;
}

describe('tc-tree-slides-element', () => {
    let element: TcTreeSlidesElement;

    beforeEach(async () => {
        element = await renderTree(structuredClone(SLIDES));
    });

    afterEach(() => {
        element.remove();
    });

    it('gives every checkbox in the tree an accessible name', () => {
        const checkboxes = element.shadowRoot!.querySelectorAll(
            'input[type="checkbox"]'
        );

        expect(checkboxes.length).toBeGreaterThan(0);
        checkboxes.forEach((checkbox) => {
            const accessibleName =
                checkbox.getAttribute('aria-label') ||
                checkbox.getAttribute('aria-labelledby');
            expect(accessibleName).toBeTruthy();
        });
    });

    it('names each leaf checkbox after its slide path', () => {
        const leafCheckbox = Array.from(
            element.shadowRoot!.querySelectorAll('input[type="checkbox"]')
        ).find((checkbox) =>
            checkbox
                .getAttribute('aria-label')
                ?.includes('chapter-1/slide-1.md')
        );

        expect(leafCheckbox).toBeTruthy();
    });

    it('names the prefix checkbox after its group', () => {
        const prefixCheckbox = Array.from(
            element.shadowRoot!.querySelectorAll('input[type="checkbox"]')
        ).find((checkbox) =>
            checkbox.getAttribute('aria-label')?.includes('chapter-1')
        );

        expect(prefixCheckbox).toBeTruthy();
    });

    it('names every nested <ul> group after its prefix, keeping native list semantics', () => {
        const nestedLists = element.shadowRoot!.querySelectorAll('li > ul');

        expect(nestedLists.length).toBe(2); // chapter-1, chapter-2
        nestedLists.forEach((ul) => {
            // No explicit `role` override: a <ul> already has the implicit
            // "list" role, which its <li> children rely on (axe's
            // `listitem` rule) — only the accessible name is added.
            expect(ul.getAttribute('role')).toBeNull();
            expect(ul.getAttribute('aria-label')).toBeTruthy();
        });
    });

    it('sets indeterminate on a prefix checkbox when only some of its children are checked', () => {
        const nestedLists = element.shadowRoot!.querySelectorAll('li > ul');
        const chapter1List = Array.from(nestedLists).find((ul) =>
            ul.getAttribute('aria-label')?.includes('chapter-1')
        )!;
        const prefixCheckbox = chapter1List.parentElement!.querySelector(
            ':scope > input[type="checkbox"]'
        ) as HTMLInputElement;

        expect(prefixCheckbox.indeterminate).toBe(true);
        expect(prefixCheckbox.checked).toBe(false);
    });

    it('does not set indeterminate when every child of a prefix is unchecked', () => {
        const nestedLists = element.shadowRoot!.querySelectorAll('li > ul');
        const chapter2List = Array.from(nestedLists).find((ul) =>
            ul.getAttribute('aria-label')?.includes('chapter-2')
        )!;
        const prefixCheckbox = chapter2List.parentElement!.querySelector(
            ':scope > input[type="checkbox"]'
        ) as HTMLInputElement;

        expect(prefixCheckbox.indeterminate).toBe(false);
        expect(prefixCheckbox.checked).toBe(false);
    });

    it('does not set indeterminate when every child of a prefix is checked', async () => {
        const allChecked = structuredClone(SLIDES).map((slide) => ({
            ...slide,
            check: true,
        }));
        const fullyCheckedElement = await renderTree(allChecked);

        const nestedLists =
            fullyCheckedElement.shadowRoot!.querySelectorAll('li > ul');
        const chapter1List = Array.from(nestedLists).find((ul) =>
            ul.getAttribute('aria-label')?.includes('chapter-1')
        )!;
        const prefixCheckbox = chapter1List.parentElement!.querySelector(
            ':scope > input[type="checkbox"]'
        ) as HTMLInputElement;

        expect(prefixCheckbox.indeterminate).toBe(false);
        expect(prefixCheckbox.checked).toBe(true);

        fullyCheckedElement.remove();
    });
});
