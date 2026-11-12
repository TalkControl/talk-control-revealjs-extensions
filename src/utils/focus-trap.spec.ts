/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    getDeepActiveElement,
    getFocusableElements,
    trapTabKey,
} from './focus-trap';

function makeKeydown(options: Partial<KeyboardEvent> = {}): KeyboardEvent {
    return new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        cancelable: true,
        ...options,
    });
}

describe('focus-trap', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('getFocusableElements', () => {
        it('finds plain focusable elements in document order', () => {
            document.body.innerHTML = `
                <div id="root">
                    <button id="b1">one</button>
                    <a id="a1" href="#">link</a>
                    <input id="i1" />
                </div>
            `;
            const root = document.getElementById('root')!;

            const result = getFocusableElements(root);

            expect(result.map((el) => el.id)).toEqual(['b1', 'a1', 'i1']);
        });

        it('excludes disabled, aria-disabled, negative-tabindex and hidden elements', () => {
            document.body.innerHTML = `
                <div id="root">
                    <button id="b1">ok</button>
                    <button id="b2" disabled>disabled</button>
                    <button id="b3" aria-disabled="true">aria-disabled</button>
                    <button id="b4" tabindex="-1">not tabbable</button>
                    <button id="b5" hidden>hidden</button>
                </div>
            `;
            const root = document.getElementById('root')!;

            const result = getFocusableElements(root);

            expect(result.map((el) => el.id)).toEqual(['b1']);
        });

        it('descends into nested shadow roots', () => {
            document.body.innerHTML = '<div id="root"></div>';
            const root = document.getElementById('root')!;

            const host = document.createElement('div');
            host.id = 'host';
            root.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
                <button id="shadow-button">inside shadow</button>
                <div id="inner-host"></div>
            `;
            const innerHost = shadow.getElementById('inner-host')!;
            const innerShadow = innerHost.attachShadow({ mode: 'open' });
            innerShadow.innerHTML = `<input id="deep-input" />`;

            const result = getFocusableElements(root);

            expect(result.map((el) => el.id)).toEqual([
                'shadow-button',
                'deep-input',
            ]);
        });

        it('returns an empty array when nothing is focusable', () => {
            document.body.innerHTML = '<div id="root"><span>text</span></div>';
            const root = document.getElementById('root')!;

            expect(getFocusableElements(root)).toEqual([]);
        });
    });

    describe('getDeepActiveElement', () => {
        it('returns document.activeElement when there is no shadow root', () => {
            document.body.innerHTML = '<button id="b1">one</button>';
            const button = document.getElementById('b1')!;
            button.focus();

            expect(getDeepActiveElement()).toBe(button);
        });

        it('resolves through nested shadow roots', () => {
            document.body.innerHTML = '<div id="host"></div>';
            const host = document.getElementById('host')!;
            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = '<button id="shadow-button">one</button>';
            const shadowButton = shadow.getElementById('shadow-button')!;
            shadowButton.focus();

            expect(getDeepActiveElement()).toBe(shadowButton);
        });
    });

    describe('trapTabKey', () => {
        let root: HTMLElement;
        let first: HTMLElement;
        let last: HTMLElement;

        beforeEach(() => {
            document.body.innerHTML = `
                <div id="root">
                    <button id="first">first</button>
                    <button id="middle">middle</button>
                    <button id="last">last</button>
                </div>
            `;
            root = document.getElementById('root')!;
            first = document.getElementById('first')!;
            last = document.getElementById('last')!;
        });

        it('wraps Tab from the last focusable element back to the first', () => {
            last.focus();
            const event = makeKeydown({ shiftKey: false });

            const handled = trapTabKey(root, event);

            expect(handled).toBe(true);
            expect(event.defaultPrevented).toBe(true);
            expect(getDeepActiveElement()).toBe(first);
        });

        it('wraps Shift+Tab from the first focusable element back to the last', () => {
            first.focus();
            const event = makeKeydown({ shiftKey: true });

            const handled = trapTabKey(root, event);

            expect(handled).toBe(true);
            expect(event.defaultPrevented).toBe(true);
            expect(getDeepActiveElement()).toBe(last);
        });

        it('lets the browser handle Tab in the middle of the list', () => {
            const middle = document.getElementById('middle')!;
            middle.focus();
            const event = makeKeydown({ shiftKey: false });

            const handled = trapTabKey(root, event);

            expect(handled).toBe(false);
            expect(event.defaultPrevented).toBe(false);
            expect(getDeepActiveElement()).toBe(middle);
        });

        it('forces focus back inside when focus has escaped the root', () => {
            const outsider = document.createElement('button');
            outsider.id = 'outsider';
            document.body.appendChild(outsider);
            outsider.focus();
            const event = makeKeydown({ shiftKey: false });

            const handled = trapTabKey(root, event);

            expect(handled).toBe(true);
            expect(getDeepActiveElement()).toBe(first);
        });

        it('ignores keys other than Tab', () => {
            last.focus();
            const event = makeKeydown({ key: 'Escape' });

            const handled = trapTabKey(root, event);

            expect(handled).toBe(false);
            expect(event.defaultPrevented).toBe(false);
        });

        it('returns false when there is nothing focusable', () => {
            document.body.innerHTML = '<div id="empty"></div>';
            const empty = document.getElementById('empty')!;
            const event = makeKeydown();

            expect(trapTabKey(empty, event)).toBe(false);
        });
    });
});
