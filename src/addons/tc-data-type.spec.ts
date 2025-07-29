/**
 * @vitest-environment jsdom
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { getShowType, manageShowTypeContent } from './tc-data-type';
import { DEFAULT_TYPE } from '../utils/const';

// Mock window.location
const mockLocation = {
    search: '',
    href: '',
    origin: 'http://localhost',
    pathname: '/',
    hash: '',
};

Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
});

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

describe(getShowType.name, () => {
    afterAll(async () => {
        window.location.search = '';
    });
    it('should use default type if nothing is specified', () => {
        document.body.innerHTML = `<div class="reveal">
            <div class="slides"></div>
        </div>`;
        const type = getShowType();
        expect(type).toBe(DEFAULT_TYPE);
    });
    it('should use type if specified in HTML', () => {
        document.body.innerHTML = `<div class="reveal">
            <div class="slides" data-type="test"></div>
        </div>`;
        const type = getShowType();
        expect(type).toBe('test');
    });

    it('should use type if specified in URL', () => {
        window.location.search = 'data-type=test2';
        document.body.innerHTML = `<div class="reveal">
            <div class="slides"></div>
        </div>`;
        const type = getShowType();
        expect(type).toBe('test2');
    });
});
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
