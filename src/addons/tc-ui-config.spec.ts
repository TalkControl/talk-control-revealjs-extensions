/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, render } from 'lit-html';
import { SlidePath } from '../models';
import { TcUiConfig } from './tc-ui-config';
import { _handle_parameter } from '../utils/helper';
import { getSlidesSelected } from '../utils/storage-service';

vi.mock('lit-html', () => ({
    html: vi.fn((strings, ...values) => ({ strings, values })),
    render: vi.fn(),
}));

vi.mock('../utils/helper', () => ({
    _handle_parameter: vi.fn(),
}));

vi.mock('../utils/storage-service', () => ({
    getSlidesSelected: vi.fn(),
}));

const HTML = `
<!DOCTYPE html>
      <html>
        <body>
          <div class="reveal">
            <div class="slides" data-theme="dark" data-type="presentation" data-lang="fr"></div>
          </div>
        </body>
      </html>
`;

const BASE_URL =
    'http://localhost:3000?data-theme=light&data-type=workshop&data-lang=en';

describe('TcUiConfig', () => {
    let tcUiConfig: TcUiConfig;
    let mockSlides: SlidePath[];

    beforeEach(() => {
        document.body.innerHTML = HTML;
        window.location.href = BASE_URL;

        mockSlides = [
            { path: 'intro/welcome.md' },
            { path: 'chapter1/basics.md' },
            { path: 'conclusion.md' },
        ];

        vi.mocked(getSlidesSelected).mockReturnValue([
            { index: 0, check: true, prefix: '', path: '/' },
            { index: 1, check: false, prefix: '', path: '/' },
        ]);

        vi.mocked(_handle_parameter).mockImplementation(
            (_urlParams, urlKey, _element, _dataKey, defaultValue) => {
                if (urlKey === 'data-theme') return 'light';
                if (urlKey === 'data-type') return 'workshop';
                if (urlKey === 'data-lang') return 'en';
                return defaultValue;
            }
        );

        tcUiConfig = new TcUiConfig(mockSlides, 'fr', 'dark', 'presentation');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with correct default state', () => {
            expect(tcUiConfig['state']).toEqual({
                show: false,
                slidesEntries: expect.any(Array),
                theme: 'light', // mocked value for _handle_parameter
                defaultTheme: 'dark',
                type: 'workshop', // mocked value for _handle_parameter
                defaultType: 'presentation',
                language: 'en', // mocked value for _handle_parameter
                defaultLanguage: 'fr',
            });
        });

        it('should call initModes during initialization', () => {
            expect(_handle_parameter).toHaveBeenCalledTimes(3);
            expect(_handle_parameter).toHaveBeenCalledWith(
                expect.any(URLSearchParams),
                'data-theme',
                expect.any(HTMLElement),
                'data-theme',
                ''
            );
        });

        it('should add keyup event listener to document.body', () => {
            const addEventListenerSpy = vi.spyOn(
                document.body,
                'addEventListener'
            );
            new TcUiConfig(mockSlides, 'fr', 'dark', 'presentation');

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'keyup',
                expect.any(Function)
            );
        });
    });

    describe('slidesToTree', () => {
        it('should convert slides to tree entries correctly', () => {
            const result = tcUiConfig.slidesToTree(mockSlides);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                prefix: 'intro',
                path: 'welcome.md',
                index: 0,
                check: true,
            });
            expect(result[1]).toEqual({
                prefix: 'chapter1',
                path: 'basics.md',
                index: 1,
                check: false,
            });
            expect(result[2]).toEqual({
                prefix: undefined,
                path: 'conclusion.md',
                index: 2,
                check: true,
            });
        });

        it('should handle slides without prefix', () => {
            const slidesWithoutPrefix: SlidePath[] = [{ path: 'simple.md' }];
            const result = tcUiConfig.slidesToTree(slidesWithoutPrefix);

            expect(result[0]).toEqual({
                prefix: undefined,
                path: 'simple.md',
                index: 0,
                check: true,
            });
        });
    });

    describe('Keyboard Event Handling', () => {
        it('should open UI when "c" key is pressed', () => {
            const keyEvent = new KeyboardEvent('keyup', { key: 'c' });
            const resetOrCreateUISpy = vi
                .spyOn(tcUiConfig, 'resetOrCreateUI')
                .mockImplementation(() => {});

            tcUiConfig['_keyUpHandler'](keyEvent);

            expect(tcUiConfig['state'].show).toBe(true);
            expect(resetOrCreateUISpy).toHaveBeenCalled();
        });

        it('should open UI when "C" key is pressed', () => {
            const keyEvent = new KeyboardEvent('keyup', { key: 'C' });
            const resetOrCreateUISpy = vi
                .spyOn(tcUiConfig, 'resetOrCreateUI')
                .mockImplementation(() => {});

            tcUiConfig['_keyUpHandler'](keyEvent);

            expect(tcUiConfig['state'].show).toBe(true);
            expect(resetOrCreateUISpy).toHaveBeenCalled();
        });

        it('should not open UI when "c" is pressed with modifier keys', () => {
            const keyEventCtrl = new KeyboardEvent('keyup', {
                key: 'c',
                ctrlKey: true,
            });
            const keyEventShift = new KeyboardEvent('keyup', {
                key: 'c',
                shiftKey: true,
            });
            const keyEventMeta = new KeyboardEvent('keyup', {
                key: 'c',
                metaKey: true,
            });

            tcUiConfig['_keyUpHandler'](keyEventCtrl);
            tcUiConfig['_keyUpHandler'](keyEventShift);
            tcUiConfig['_keyUpHandler'](keyEventMeta);

            expect(tcUiConfig['state'].show).toBe(false);
        });

        it('should close UI when Escape key is pressed and UI is shown', () => {
            tcUiConfig['state'].show = true;

            const mockElement = document.createElement('div');
            mockElement.id = 'ui-slide-selector';
            document.body.appendChild(mockElement);

            const keyEvent = new KeyboardEvent('keyup', { key: 'Escape' });
            tcUiConfig['_keyUpHandler'](keyEvent);

            expect(tcUiConfig['state'].show).toBe(false);
        });

        it('should not close UI when Escape is pressed but UI is not shown', () => {
            tcUiConfig['state'].show = false;
            const closeUISpy = vi.spyOn(tcUiConfig, 'closeUI');

            const keyEvent = new KeyboardEvent('keyup', { key: 'Escape' });
            tcUiConfig['_keyUpHandler'](keyEvent);

            expect(closeUISpy).not.toHaveBeenCalled();
        });
    });

    describe('UI Management', () => {
        it('should close UI and remove element from DOM', () => {
            const mockElement = document.createElement('div');
            mockElement.id = 'ui-slide-selector';
            document.body.appendChild(mockElement);

            tcUiConfig['state'].show = true;
            tcUiConfig.closeUI();

            expect(tcUiConfig['state'].show).toBe(false);
            expect(document.querySelector('#ui-slide-selector')).toBeNull();
        });

        it('should create new UI element if it does not exist', () => {
            tcUiConfig['state'].show = true;
            const initUISpy = vi
                .spyOn(tcUiConfig, 'initUI')
                .mockImplementation(vi.fn());

            tcUiConfig.resetOrCreateUI();

            const element = document.querySelector('#ui-slide-selector');
            expect(element).toBeTruthy();
            expect(element?.id).toBe('ui-slide-selector');
            expect(initUISpy).toHaveBeenCalledWith(element);
        });

        it('should reuse existing UI element', () => {
            const existingElement = document.createElement('div');
            existingElement.id = 'ui-slide-selector';
            document.body.appendChild(existingElement);

            tcUiConfig['state'].show = true;
            const initUISpy = vi
                .spyOn(tcUiConfig, 'initUI')
                .mockImplementation(vi.fn());

            tcUiConfig.resetOrCreateUI();

            expect(initUISpy).toHaveBeenCalledWith(existingElement);
            expect(
                document.querySelectorAll('#ui-slide-selector')
            ).toHaveLength(1);
        });

        it('should call render with correct template in initUI', () => {
            const mockElement = document.createElement('div');

            tcUiConfig.initUI(mockElement);

            expect(html).toHaveBeenCalled();
            expect(render).toHaveBeenCalledWith(
                expect.any(Object),
                mockElement
            );
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete workflow: open UI with keyboard, then close with escape', () => {
            const openKeyEvent = new KeyboardEvent('keyup', { key: 'c' });
            tcUiConfig['_keyUpHandler'](openKeyEvent);

            expect(tcUiConfig['state'].show).toBe(true);
            expect(document.querySelector('#ui-slide-selector')).toBeTruthy();

            const closeKeyEvent = new KeyboardEvent('keyup', { key: 'Escape' });
            tcUiConfig['_keyUpHandler'](closeKeyEvent);

            expect(tcUiConfig['state'].show).toBe(false);
            expect(document.querySelector('#ui-slide-selector')).toBeNull();
        });
    });
});
