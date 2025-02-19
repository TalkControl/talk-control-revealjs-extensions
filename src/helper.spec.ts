/**
 * @vitest-environment jsdom
 */
import { _handle_parameter } from './helper';
import { beforeEach, describe, expect, it } from 'vitest';

describe(_handle_parameter.name, () => {

    let slidesElement: HTMLElement;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '<div class="slides"></div>';
        slidesElement = document.querySelector('.slides')!;
    });

    it('it should set data attributes if queryParam set', () => {
        const url = new URL('http://localhost?theme=data');
        const urlParams: URLSearchParams = new URLSearchParams(url.search);
        const themeValue = _handle_parameter(urlParams, 'theme', slidesElement, 'data-theme', 'default');

        expect(themeValue).toBe('data');
    });

    it('it should set default data attributes if queryParam is wront set', () => {
        const url = new URL('http://localhost?theme-wrong=data');
        const urlParams: URLSearchParams = new URLSearchParams(url.search);
        const themeValue = _handle_parameter(urlParams, 'theme', slidesElement, 'data-theme', 'default');

        expect(themeValue).toBe('default');
    });

    it('it should set default data attributes if no query params', () => {
        const url = new URL('http://localhost');
        const urlParams: URLSearchParams = new URLSearchParams(url.search);
        const themeValue = _handle_parameter(urlParams, 'theme', slidesElement, 'data-theme', 'default');

        expect(themeValue).toBe('default');
    });

    it('it should not fallback to default if data attributes already set', () => {
        const url = new URL('http://localhost');
        slidesElement.setAttribute('data-theme', 'data')
        const urlParams: URLSearchParams = new URLSearchParams(url.search);
        const themeValue = _handle_parameter(urlParams, 'theme', slidesElement, 'data-theme', 'default');

        expect(themeValue).toBe('data');
    });

    it('it should override with query param the data attributes if already set', () => {
        const url = new URL('http://localhost?theme=override');
        slidesElement.setAttribute('data-theme', 'data')
        const urlParams: URLSearchParams = new URLSearchParams(url.search);
        const themeValue = _handle_parameter(urlParams, 'theme', slidesElement, 'data-theme', 'default');

        expect(themeValue).toBe('override');
    });

    it('it should mutate html element if query param is set', () => {
        const url = new URL('http://localhost?theme=data');
        const urlParams: URLSearchParams = new URLSearchParams(url.search);
        _handle_parameter(urlParams, 'theme', slidesElement, 'data-theme', 'default');

        expect(slidesElement.getAttribute('data-theme')).toBe('data');
    });

    it('it should mutate html element with default value if no query param is set', () => {
        const url = new URL('http://localhost');
        const urlParams: URLSearchParams = new URLSearchParams(url.search);
        _handle_parameter(urlParams, 'theme', slidesElement, 'data-theme', 'default');

        expect(slidesElement.getAttribute('data-theme')).toBe('default');
    });
});