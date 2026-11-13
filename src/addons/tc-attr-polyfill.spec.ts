/**
 * @vitest-environment jsdom
 */
import { _internals, manageAttrPolyfill } from './tc-attr-polyfill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Waits for a MutationObserver callback (queued as a microtask) to run. */
async function flushMutations(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('tc-attr-polyfill', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="reveal">
                <div class="slides"></div>
            </div>
        `;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('does nothing when the browser supports typed attr() natively', async () => {
        vi.stubGlobal('CSS', { supports: () => true });
        const observerSpy = vi.fn();
        vi.stubGlobal('MutationObserver', observerSpy);

        const root = document.querySelector('.slides') as HTMLElement;
        root.innerHTML = `<i class="tc-icons" data-tc-icon-color="red"></i>`;

        manageAttrPolyfill(root);
        await flushMutations();

        expect(observerSpy).not.toHaveBeenCalled();
        const icon = root.querySelector('.tc-icons') as HTMLElement;
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('');
    });

    it('mirrors a watched data-tc-* attribute onto its --tc-* custom property when unsupported', () => {
        vi.stubGlobal('CSS', { supports: () => false });

        const root = document.querySelector('.slides') as HTMLElement;
        root.innerHTML = `<i class="tc-icons" data-tc-icon-color="red"></i>`;

        manageAttrPolyfill(root);

        const icon = root.querySelector('.tc-icons') as HTMLElement;
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('red');
    });

    it('copies all three mapped keys (icon color, icon size, admonition bg color)', () => {
        vi.stubGlobal('CSS', { supports: () => false });

        const root = document.querySelector('.slides') as HTMLElement;
        root.innerHTML = `
            <i class="tc-icons" data-tc-icon-color="red" data-tc-icon-size="2em"></i>
            <p class="admonition custom" data-tc-admonition-bg-color="#d7be00"></p>
        `;

        manageAttrPolyfill(root);

        const icon = root.querySelector('.tc-icons') as HTMLElement;
        const admonition = root.querySelector('.admonition') as HTMLElement;
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('red');
        expect(icon.style.getPropertyValue('--tc-icon-size')).toBe('2em');
        expect(
            admonition.style.getPropertyValue('--tc-admonition-bg-color')
        ).toBe('#d7be00');
    });

    it('lets the attribute win over an existing inline --tc-* style', () => {
        vi.stubGlobal('CSS', { supports: () => false });

        const root = document.querySelector('.slides') as HTMLElement;
        root.innerHTML = `<i class="tc-icons" style="--tc-icon-color:blue;" data-tc-icon-color="red"></i>`;

        manageAttrPolyfill(root);

        const icon = root.querySelector('.tc-icons') as HTMLElement;
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('red');
    });

    it('applies the property to an element added after activation (MutationObserver)', async () => {
        vi.stubGlobal('CSS', { supports: () => false });

        const root = document.querySelector('.slides') as HTMLElement;
        manageAttrPolyfill(root);

        const icon = document.createElement('i');
        icon.classList.add('tc-icons');
        icon.setAttribute('data-tc-icon-color', 'green');
        root.appendChild(icon);

        await flushMutations();

        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('green');
    });

    it('keeps the property in sync when the attribute is modified then removed', async () => {
        vi.stubGlobal('CSS', { supports: () => false });

        const root = document.querySelector('.slides') as HTMLElement;
        root.innerHTML = `<i class="tc-icons" data-tc-icon-color="red"></i>`;
        manageAttrPolyfill(root);

        const icon = root.querySelector('.tc-icons') as HTMLElement;
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('red');

        icon.setAttribute('data-tc-icon-color', 'blue');
        await flushMutations();
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('blue');

        icon.removeAttribute('data-tc-icon-color');
        await flushMutations();
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('');
    });

    it('ignores an unknown data-tc-* attribute', () => {
        vi.stubGlobal('CSS', { supports: () => false });

        const root = document.querySelector('.slides') as HTMLElement;
        root.innerHTML = `<i class="tc-icons" data-tc-foo="bar"></i>`;

        expect(() => manageAttrPolyfill(root)).not.toThrow();

        const icon = root.querySelector('.tc-icons') as HTMLElement;
        expect(icon.style.getPropertyValue('--tc-foo')).toBe('');
        expect(icon.getAttribute('style')).toBeFalsy();
    });

    it('treats a missing CSS.supports as unsupported, without throwing', () => {
        // jsdom has no `CSS` global by default: this is the real "absent" case.
        expect(typeof (globalThis as { CSS?: unknown }).CSS).toBe('undefined');

        const root = document.querySelector('.slides') as HTMLElement;
        root.innerHTML = `<i class="tc-icons" data-tc-icon-color="red"></i>`;

        expect(() => manageAttrPolyfill(root)).not.toThrow();

        const icon = root.querySelector('.tc-icons') as HTMLElement;
        expect(icon.style.getPropertyValue('--tc-icon-color')).toBe('red');
    });

    it('does nothing and does not throw when root is null', () => {
        expect(() => manageAttrPolyfill(null)).not.toThrow();
    });

    describe('_internals', () => {
        it('exposes the finite attribute-to-css-var mapping table', () => {
            expect(_internals?.ATTR_TO_CSS_VAR).toEqual({
                'data-tc-icon-color': '--tc-icon-color',
                'data-tc-icon-size': '--tc-icon-size',
                'data-tc-admonition-bg-color': '--tc-admonition-bg-color',
            });
        });
    });
});
