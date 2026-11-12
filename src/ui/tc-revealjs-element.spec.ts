/**
 * @vitest-environment jsdom
 */
import './tc-revealjs-element';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TcRevealjsElement } from './tc-revealjs-element';

describe('tc-revealjs-element', () => {
    let element: TcRevealjsElement;

    beforeEach(async () => {
        element = document.createElement(
            'tc-revealjs-element'
        ) as TcRevealjsElement;
        document.body.appendChild(element);
        await element.updateComplete;
    });

    afterEach(() => {
        element.remove();
    });

    it('wraps the shortcuts table rows in a rowgroup, with columnheader cells for the header row', () => {
        const table = element.shadowRoot!.querySelector(
            '[role="table"]'
        ) as HTMLElement;
        expect(table).toBeTruthy();

        const rowgroups = table.querySelectorAll(':scope > [role="rowgroup"]');
        expect(rowgroups.length).toBeGreaterThanOrEqual(2); // header + body

        const headerRow = table.querySelector(
            '[role="rowgroup"] [role="row"]'
        ) as HTMLElement;
        const columnHeaders = headerRow.querySelectorAll(
            '[role="columnheader"]'
        );
        expect(columnHeaders.length).toBeGreaterThanOrEqual(2);
    });

    it('gives every row only columnheader/cell children (aria-required-children)', () => {
        const rows = element.shadowRoot!.querySelectorAll('[role="row"]');
        expect(rows.length).toBeGreaterThan(0);

        rows.forEach((row) => {
            Array.from(row.children).forEach((child) => {
                const role = child.getAttribute('role');
                expect(['columnheader', 'cell', 'rowheader']).toContain(role);
            });
        });
    });

    it('still gives the editable shortcut input a cell role once edit mode renders it', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any).editMode = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any).shortcuts = {
            next: { keys: 'N', description: 'Next slide', editable: true },
        };
        await element.updateComplete;

        const editableInput = element.shadowRoot!.querySelector(
            'input.shortcut-keys.editable'
        );
        expect(editableInput).toBeTruthy();
        expect(editableInput!.getAttribute('role')).toBe('cell');
    });

    it('uses a heading level consistent with its siblings (no h3 skipping an h2)', () => {
        const headings = Array.from(
            element.shadowRoot!.querySelectorAll('h1, h2, h3, h4, h5, h6')
        );
        headings.forEach((heading) => {
            expect(heading.tagName.toLowerCase()).not.toBe('h3');
        });
    });
});
