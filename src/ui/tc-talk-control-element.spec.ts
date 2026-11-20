/**
 * @vitest-environment jsdom
 */
import './tc-talk-control-element';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TcTalkControlElement } from './tc-talk-control-element';

describe('TcTalkControlElement (issue #131 - no focus-stealing on mount)', () => {
    let element: TcTalkControlElement;

    beforeEach(async () => {
        element = document.createElement(
            'tc-talk-control-element'
        ) as TcTalkControlElement;
        document.body.appendChild(element);
        await element.updateComplete;
    });

    afterEach(() => {
        element.remove();
    });

    it('does not move focus into itself when it mounts', () => {
        // Initial focus is a dialog-level concern, owned by the parent
        // `tc-configurator-element` (see its own `firstUpdated`/`focusFirstElement`).
        // This nested component is remounted every time its tab becomes
        // active again (see `tc-configurator-element`'s conditional render),
        // so it must never grab focus itself - doing so used to fight with
        // the dialog's own tab-switch focus management (issue #131).
        expect(element.shadowRoot!.activeElement).toBeNull();
        expect(document.activeElement).not.toBe(
            element.shadowRoot!.querySelector('#mode-theme')
        );
    });
});
