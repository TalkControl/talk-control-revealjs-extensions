/**
 * @vitest-environment jsdom
 */
import {
    TcCopyClipboardOptions,
    _internals,
    manageCopyClipboard,
} from './tc-copy-clipboard';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';

const HTML = `
<div class="reveal">
    <div class="slides">
        <section class="with-code">
            <pre><code>const example = "test code";</code></pre>
        </section>
        <section class="tc-multiple-columns">
            <div class="tc-column with-code"">
                <pre>
                    <code>const example = "test code";</code>
                    <code>function test() { return true; }</code>
                </pre>
            </div>
            <div class="tc-column"></div>
        </section>
        
    </div>
</div>
`;

describe('tc-copy-clipboard', () => {
    let mockClipboard: { writeText: (text: string) => Promise<void> };
    const mockTcIconOption: MarkedTcIconsOptions = {
        htmlAttribute: 'class',
        iconInTag: false,
        includesKeyword: true,
        keyword: 'keyword',
        copyKeyword: 'key-copy',
    };

    const options: TcCopyClipboardOptions = {
        active: true,
        tcIconOption: mockTcIconOption,
    };

    beforeEach(() => {
        vi.resetAllMocks();

        document.body.innerHTML = HTML;

        mockClipboard = {
            writeText: vi.fn().mockResolvedValue(undefined),
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                clipboard: mockClipboard,
            },
            writable: true,
        });
    });

    describe('manageCopyClipboard', () => {
        it('should do nothing if not active', () => {
            manageCopyClipboard({ active: false });

            const svgElement = document.querySelector(
                '.tc-copy-to-clipboard'
            ) as HTMLElement;

            expect(svgElement).toBeNull();
        });

        it('should add copy icons to pre blocks', () => {
            manageCopyClipboard(options);

            const copyIcons = document.querySelectorAll(
                '.tc-copy-to-clipboard'
            );
            expect(copyIcons.length).toBe(2);
        });

        it('should call initFunction if provided', () => {
            const mockInitFunction = vi.fn();
            const mockTcIconOptionModified: MarkedTcIconsOptions = {
                ...mockTcIconOption,
                initFunction: mockInitFunction,
            };

            const options: TcCopyClipboardOptions = {
                active: true,
                tcIconOption: mockTcIconOptionModified,
            };

            manageCopyClipboard(options);

            expect(mockInitFunction).toHaveBeenCalledTimes(1);
        });

        it('should add event listeners to copy icons', () => {
            const addEventListenerSpy = vi.spyOn(
                HTMLElement.prototype,
                'addEventListener'
            );

            manageCopyClipboard(options);

            expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'click',
                expect.any(Function)
            );
        });
    });

    describe('_getIconElement', () => {
        it('should create span element with correct class', () => {
            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            expect(iconElement?.tagName.toLowerCase()).toBe('span');
            expect(
                iconElement?.classList.contains('tc-copy-to-clipboard')
            ).toBe(true);
        });

        it('should contain an i element', () => {
            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement).toBeTruthy();
        });

        it('should create icon element with class attribute - in tag', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'class', // Use class
                iconInTag: true, // Do not use icon in tag
                includesKeyword: false, // Do not include keyword
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement).toBeTruthy();
            expect(iElement?.classList.contains('tc-icons')).toBe(true);
            expect(iElement?.classList.contains('key-icon')).toBe(false);
            expect(iElement?.classList.contains('keyword')).toBe(false);
        });

        it('should create icon element with class attribute - in tag + keyword', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'class', // Use class
                iconInTag: true, // Do not use icon in tag
                includesKeyword: true, // Include keyword
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement).toBeTruthy();
            expect(iElement?.classList.contains('tc-icons')).toBe(true);
            expect(iElement?.classList.contains('key-icon')).toBe(false);
            expect(iElement?.classList.contains('keyword')).toBe(true);
        });

        it('should create icon element with class attribute - not in tag', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'class', // Use class
                iconInTag: false, // Do not use icon in tag
                includesKeyword: false, // Do not include keyword
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement).toBeTruthy();
            expect(iElement?.classList.contains('tc-icons')).toBe(true);
            expect(iElement?.classList.contains('key-copy')).toBe(true);
        });

        it('should create icon element with class tc-icons if custom attribute', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'data-icon', // Use class
                iconInTag: true, // icon in tag
                includesKeyword: false, // Do not include keyword
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement).toBeTruthy();
            expect(iElement?.classList.contains('tc-icons')).toBe(true);
        });

        it('should create icon element with custom attribute', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'data-icon',
                iconInTag: true,
                includesKeyword: false,
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement?.getAttribute('data-icon')).toBe('');
        });

        it('should create icon element with custom attribute - not icon in tag', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'data-icon',
                iconInTag: false,
                includesKeyword: false,
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement?.getAttribute('data-icon')).toBe('key-copy');
        });

        it('should create icon element with custom attribute - include keyword', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'data-icon',
                iconInTag: true,
                includesKeyword: true,
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement?.getAttribute('data-icon')).toBe(' keyword');
        });

        it('should create icon element with custom attribute - not icon in tag and include keyword', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'data-icon',
                iconInTag: false,
                includesKeyword: true,
                keyword: 'keyword',
                copyKeyword: 'key-copy',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement?.getAttribute('data-icon')).toBe(
                'key-copy keyword'
            );
        });

        it('should create icon element with icon in tag', () => {
            const mockTcIconOption: MarkedTcIconsOptions = {
                htmlAttribute: 'class',
                iconInTag: true,
                includesKeyword: false,
                keyword: 'keyword',
                copyKeyword: 'key-icon',
            };

            const iconElement = _internals?._getIconElement(
                mockTcIconOption,
                'key-copy'
            );

            const iElement = iconElement?.querySelector('i');
            expect(iElement?.innerHTML).toBe('key-copy');
        });
    });

    describe('_addToClipboardCallback', () => {
        const HTMLClipBoard = `
        <div class="reveal">
            <div class="slides">
                <section class="with-code">
                    <pre>
                        <code>const example = "test code";</code>
                        <span class="tc-copy-to-clipboard"><svg><path></path></svg></span>
                    </pre>
                </section>
            </div>
        </div>
        `;

        let elementClickable: HTMLElement;
        let mockEvent: Event;

        beforeEach(() => {
            document.body.innerHTML = HTMLClipBoard;

            elementClickable = document.querySelector(
                '.tc-copy-to-clipboard'
            ) as HTMLElement;
            mockEvent = new Event('click');
            Object.defineProperty(mockEvent, 'target', {
                value: elementClickable,
            });
        });

        it('should copy code to clipboard', () => {
            // Mock de innerText due to fact that innerText is not available in JSDOM
            const codeElement = document.querySelector('code');
            Object.defineProperty(codeElement, 'innerText', {
                get: () => codeElement?.innerHTML,
                configurable: true,
            });

            _internals?._addToClipboardCallback(mockEvent);

            expect(mockClipboard.writeText).toHaveBeenCalledWith(
                'const example = "test code";'
            );
        });

        it('should copy code to clipboard even if click is on path', () => {
            elementClickable = document.querySelector(
                '.tc-copy-to-clipboard path'
            ) as HTMLElement;
            mockEvent = new Event('click');
            Object.defineProperty(mockEvent, 'target', {
                value: elementClickable,
            });

            // Mock de innerText due to fact that innerText is not available in JSDOM
            const codeElement = document.querySelector('code');
            Object.defineProperty(codeElement, 'innerText', {
                get: () => codeElement?.innerHTML,
                configurable: true,
            });

            _internals?._addToClipboardCallback(mockEvent);

            expect(mockClipboard.writeText).toHaveBeenCalledWith(
                'const example = "test code";'
            );
        });

        it('should add copied class', () => {
            _internals?._addToClipboardCallback(mockEvent);

            expect(elementClickable.classList.contains('copied')).toBe(true);
        });
        it('should call _addPopupCopied', () => {
            expect(document.querySelector('.tc-copy-popup')).toBeNull();

            _internals?._addToClipboardCallback(mockEvent);

            const popup = document.querySelector('.tc-copy-popup');
            expect(popup).not.toBeNull();
        });
    });

    describe('_addPopupCopied', () => {
        const HTMLClipBoard = `
        <div class="reveal">
            <div class="slides">
                <section class="with-code">
                    <pre>
                        <code>const example = "test code";</code>
                        <span class="tc-copy-to-clipboard"><svg><path></path></svg></span>
                    </pre>
                </section>
            </div>
        </div>
        `;

        beforeEach(() => {
            document.body.innerHTML = HTMLClipBoard;
        });

        it('should add and remove popup', () => {
            const parentElement = document.querySelector('pre') as HTMLElement;

            _internals?._addPopupCopied(parentElement);

            const popup = document.querySelector('.tc-copy-popup');
            expect(popup).not.toBeNull();
        });

        it('should not add popup if one already exists', () => {
            const parentElement = document.querySelector('pre') as HTMLElement;

            const existingPopup = document.createElement('div');
            existingPopup.classList.add('tc-copy-popup');
            document.body.appendChild(existingPopup);

            _internals?._addPopupCopied(parentElement);

            const popups = document.querySelectorAll('.tc-copy-popup');
            expect(popups.length).toBe(1);
        });
    });
});
