/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { manageMultiplesColumns } from './tc-multiples-cols';

const HTML = `
<div class="reveal">
    <div class="slides">
        <section class="stack tc-multiple-columns">
            <div class="tc-column">
            <section>
            Content
            </section>
            </div>
            <div class="tc-column">
            <section aria-hidden="true" hidden>
                Content
            </section>
            </div>
        </section>
        <section class="present" aria-hidden="true" hidden>
            Content
        </section>
        <section class="stack" aria-hidden="true" hidden>
            <section>
                vertical slide
            </section>
            <section>
                vertical slide
            </section>
        </section>
    </div>
</div>
`;

describe(manageMultiplesColumns.name, () => {

    beforeEach(async () => {
        document.body.innerHTML = HTML;
    });

    it('should remove aria-hidden from sections in columns', () => {
        const selector = 'section.tc-multiple-columns section[aria-hidden]';
        expect(document.querySelector(selector)).toBeDefined();
        manageMultiplesColumns();
        expect(document.querySelector(selector)).toBeNull();
    });

    it('should not remove aria-hidden from sections not in columns', () => {
        const selector = 'section[aria-hidden]';
        let sectionAriaHidden = [...document.querySelectorAll(selector)];
        expect(sectionAriaHidden).length(3);
        manageMultiplesColumns();
        sectionAriaHidden = [...document.querySelectorAll(selector)];
        expect(sectionAriaHidden).length(2);
    });

    it('should remove hidden from sections in columns', () => {
        const selector = 'section.tc-multiple-columns section[hidden]';
        expect(document.querySelector(selector)).toBeDefined();
        manageMultiplesColumns();
        expect(document.querySelector(selector)).toBeNull();
    });

    it('should not remove hidden from sections not in columns', () => {
        const selector = 'section[hidden]';
        let sectionAriaHidden = [...document.querySelectorAll(selector)];
        expect(sectionAriaHidden).length(3);
        manageMultiplesColumns();
        sectionAriaHidden = [...document.querySelectorAll(selector)];
        expect(sectionAriaHidden).length(2);
    });

    it('should remove stack class from sections in columns', () => {
        const sectionMultipleColumn = document.querySelector('section.tc-multiple-columns');
        expect(sectionMultipleColumn?.classList.contains('stack')).toBeTruthy();
        manageMultiplesColumns();
        expect(sectionMultipleColumn?.classList.contains('stack')).toBeFalsy();
    });

    it('should not remove stack class from sections not in columns', () => {
        expect(document.querySelectorAll('section.stack')).length(2);
        manageMultiplesColumns();
        expect(document.querySelectorAll('section.stack')).length(1);
    });


});