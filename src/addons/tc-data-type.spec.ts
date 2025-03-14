/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { manageShowTypeContent } from './tc-data-type';

const HTML = `
<div class="reveal">
    <div class="slides">
        <section>
            Content            
        </section>
        <section data-type-show="on-stage">
            Content
        </section>
        <section data-type-show="restitution">
            Content
        </section>
        <section data-type-show="on-stage">
            Content
        </section>
        <section data-type-show="one-state other-state">
            Content
        </section>
        <section data-type-show="one-state">
            Content
        </section>
    </div>
</div>
`;

describe(manageShowTypeContent.name, () => {
    beforeEach(async () => {
        document.body.innerHTML = HTML;
    });

    it('should use default type if none specified in HTML', () => {
        const selector = 'section';
        manageShowTypeContent();
        expect(document.querySelectorAll(selector).length).toBe(3);
    });

    it('should use specified theme type if specified in HTML', () => {
        const slidesElement = document.querySelector('.slides')!;
        slidesElement.setAttribute('data-type', 'restitution');
        const selector = 'section';
        manageShowTypeContent();
        expect(document.querySelectorAll(selector).length).toBe(2);
    });

    it('should return all slides if type "all" is asked', () => {
        const slidesElement = document.querySelector('.slides')!;
        slidesElement.setAttribute('data-type', 'all');
        const selector = 'section';
        manageShowTypeContent();
        expect(document.querySelectorAll(selector).length).toBe(6);
    });

    it('should clean parent section in case of vertical slides', () => {
        document.body.innerHTML = `
        <div class="reveal">
            <div class="slides">
                <section>
                    Content            
                </section>
                <section>
                    <section data-type-show="vertical">
                        Content
                    </section>
                    <section data-type-show="vertical">
                        Content
                    </section>
                </section>
            </div>
        </div>`;
        const selector = 'section';
        manageShowTypeContent();
        expect(document.querySelectorAll(selector).length).toBe(1);
    });

    it('should allow multiples states and return corrects slides', () => {
        let slidesElement = document.querySelector('.slides')!;
        slidesElement.setAttribute('data-type', 'one-state');
        const selector = 'section';
        manageShowTypeContent();
        expect(document.querySelectorAll(selector).length).toBe(3);
        document.body.innerHTML = HTML;
        slidesElement = document.querySelector('.slides')!;
        slidesElement.setAttribute('data-type', 'other-state');
        manageShowTypeContent();
        expect(document.querySelectorAll(selector).length).toBe(2);
    });
});
