/**
 * @vitest-environment jsdom
 */
import './tc-configurator-element';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TcConfiguratorElement } from './tc-configurator-element';

describe('TcConfiguratorElement (issue #106 - a11y)', () => {
    let element: TcConfiguratorElement;

    beforeEach(async () => {
        element = document.createElement(
            'tc-configurator-element'
        ) as TcConfiguratorElement;
        document.body.appendChild(element);
        await element.updateComplete;
    });

    afterEach(() => {
        element.remove();
    });

    it('moves initial focus into the dialog (the close button) once rendered', () => {
        const closeButton = element.shadowRoot!.querySelector(
            '#ui-slide-selector-close'
        );

        expect(element.shadowRoot!.activeElement).toBe(closeButton);
    });

    describe('close button (no duplicate Enter/Space handling)', () => {
        it('has no custom keydown handler left on it - only the native button behavior', () => {
            const closeButton = element.shadowRoot!.querySelector(
                '#ui-slide-selector-close'
            )!;

            // A native <button> already fires 'click' on its own for Enter/Space;
            // dispatching the keydown directly (bypassing that native behavior)
            // must not by itself trigger a close - there must be no leftover
            // custom keydown listener duplicating it.
            const handler = vi.fn();
            element.addEventListener('close-ui', handler);

            closeButton.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: 'Enter',
                    bubbles: true,
                    cancelable: true,
                })
            );
            closeButton.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: ' ',
                    bubbles: true,
                    cancelable: true,
                })
            );

            expect(handler).not.toHaveBeenCalled();
        });

        it('dispatches close-ui exactly once per click', () => {
            const closeButton = element.shadowRoot!.querySelector(
                '#ui-slide-selector-close'
            ) as HTMLButtonElement;
            const handler = vi.fn();
            element.addEventListener('close-ui', handler);

            closeButton.click();

            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe('focus trap', () => {
        it('wraps Tab from the last focusable element back to the first', () => {
            const applyButton = element.shadowRoot!.querySelector(
                '#applyChange'
            ) as HTMLButtonElement;
            const closeButton = element.shadowRoot!.querySelector(
                '#ui-slide-selector-close'
            );
            applyButton.focus();

            const dialog =
                element.shadowRoot!.querySelector('[role="dialog"]')!;
            const event = new KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true,
                cancelable: true,
            });
            dialog.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
            expect(element.shadowRoot!.activeElement).toBe(closeButton);
        });

        it('wraps Shift+Tab from the first focusable element back to the last', () => {
            const closeButton = element.shadowRoot!.querySelector(
                '#ui-slide-selector-close'
            ) as HTMLButtonElement;
            const applyButton =
                element.shadowRoot!.querySelector('#applyChange');
            closeButton.focus();

            const dialog =
                element.shadowRoot!.querySelector('[role="dialog"]')!;
            const event = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            dialog.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
            expect(element.shadowRoot!.activeElement).toBe(applyButton);
        });

        it('does not interfere with Tab presses that stay within the dialog', () => {
            const talkControlTab = element.shadowRoot!.querySelector(
                '#talk-control-tab'
            ) as HTMLButtonElement;
            talkControlTab.focus();

            const dialog =
                element.shadowRoot!.querySelector('[role="dialog"]')!;
            const event = new KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true,
                cancelable: true,
            });
            dialog.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
        });
    });
});
