/**
 * @vitest-environment jsdom
 */
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    TalkControlPluginOptions,
    TalkControlTheme,
    _internals,
} from './theme-plugin';
import {
    TcCustomBackgroundMap,
    customBackgrounds,
} from './addons/tc-custom-background';
import Reveal from 'reveal.js';
import { manageCopyClipboard } from './addons/tc-copy-clipboard';
import { manageMultiplesColumns } from './addons/tc-multiples-cols';
import { manageShowTypeContent } from './addons/tc-data-type';
import { manageTheme } from './addons/tc-theme';
import { transformListFragment } from './addons/tc-list-fragment';

// Mocks dependances
vi.mock('./addons/tc-custom-background', () => ({
    customBackgrounds: vi.fn(),
}));

vi.mock('./addons/tc-theme', () => ({
    manageTheme: vi.fn(),
}));

vi.mock('./addons/tc-copy-clipboard', () => ({
    manageCopyClipboard: vi.fn(),
}));

vi.mock('./addons/tc-data-type', () => ({
    manageShowTypeContent: vi.fn(),
}));

vi.mock('./addons/tc-multiples-cols', () => ({
    manageMultiplesColumns: vi.fn(),
    postManageMultiplesColumns: vi.fn(),
}));

vi.mock('./addons/tc-list-fragment', () => ({
    transformListFragment: vi.fn(),
}));

describe('TalkControlTheme', () => {
    let mockOptions: TalkControlPluginOptions;

    // Initial Setup
    beforeEach(() => {
        // Mock options
        mockOptions = {
            tcCustomBackgroundOptions: {
                basePath: './',
                mapBackgrounds: () => ({
                    'custom-bg': 'custom-value',
                }),
            },
            tcMarkedOptions: {
                fontIcons: [],
                knowStyles: ['style1', 'style2'],
            },
            tcThemeOptions: {
                defaultTheme: 'tc',
            },
            activeCopyClipboard: true,
        };

        // Setup virtual DOM
        document.body.innerHTML = `
            <div class="reveal">
                <div class="slides"></div>
            </div>
            <link href="path/to/css/talk-control-reavealjs-theme.css" />
        `;
    });

    afterEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('Constructor', () => {
        it('should initialize with correct options and find slides element', () => {
            const theme = new TalkControlTheme(mockOptions);

            expect(theme.slidesElement).not.toBeNull();
            expect(theme.options).toBe(mockOptions);
        });
    });

    describe('postprocess', () => {
        it('should setup event listeners and call required functions', () => {
            const theme = new TalkControlTheme(mockOptions);
            const mockAddEventListener = vi.spyOn(Reveal, 'addEventListener');

            theme.postprocess();

            expect(mockAddEventListener).toHaveBeenCalledWith(
                'ready',
                expect.any(Function)
            );

            // Simulate ready event
            const readyCallback = mockAddEventListener.mock
                .calls[0][1] as () => void;
            readyCallback();

            expect(manageCopyClipboard).not.toHaveBeenCalled();
            expect(manageShowTypeContent).toHaveBeenCalled();
            expect(manageMultiplesColumns).toHaveBeenCalled();
            expect(transformListFragment).toHaveBeenCalled();
            expect(customBackgrounds).toHaveBeenCalled();
            expect(manageTheme).toHaveBeenCalled();
        });

        it('should setup call manageCopyClipboard if fontIcons passed', () => {
            const fontIcons = [
                {
                    keyword: 'icon',
                    copyKeyword: 'copy',
                    htmlAttribute: 'class',
                },
            ];

            const theme = new TalkControlTheme({
                ...mockOptions,
                tcMarkedOptions: {
                    ...mockOptions.tcMarkedOptions,
                    fontIcons,
                },
            });
            const mockAddEventListener = vi.spyOn(Reveal, 'addEventListener');

            theme.postprocess();

            expect(mockAddEventListener).toHaveBeenCalledWith(
                'ready',
                expect.any(Function)
            );

            // Simulate ready event
            const readyCallback = mockAddEventListener.mock
                .calls[0][1] as () => void;
            readyCallback();

            expect(manageCopyClipboard).toHaveBeenCalledWith({
                active: mockOptions.activeCopyClipboard,
                tcIconOption: fontIcons[0],
            });
        });
    });

    describe('extractPath', () => {
        it('should extract correct path from theme CSS link', () => {
            const theme = new TalkControlTheme(mockOptions);
            theme.postprocess();

            expect(theme.path).toBe('http://localhost:3000/path/to/');
        });

        it('should return empty string if theme CSS link not found', () => {
            document.body.innerHTML = '<div></div>'; // No CSS link
            const theme = new TalkControlTheme(mockOptions);
            theme.postprocess();

            expect(theme.path).toBe('');
        });
    });

    describe('_processBackgroundThemeOptions', () => {
        it('should merge default and custom background mappings', () => {
            const customOptions = {
                basePath: './',
                mapBackgrounds: () => ({
                    'custom-key': 'custom-value',
                }),
            };

            const result =
                _internals!._processBackgroundThemeOptions(customOptions);
            const mappings = result.mapBackgrounds();

            expect(mappings).toEqual(
                expect.objectContaining({
                    'quote-slide': 'var(--tc-quote-slide-bg-color)',
                    'custom-key': 'custom-value',
                })
            );
        });

        it('should override default theme if passed as custom background mappings', () => {
            const customOptions = {
                basePath: './',
                mapBackgrounds: () => ({
                    'quote-slide': 'custom-value',
                }),
            };

            const result =
                _internals!._processBackgroundThemeOptions(customOptions);
            const mappings = result.mapBackgrounds();

            expect(mappings).toEqual(
                expect.objectContaining({
                    'quote-slide': 'custom-value',
                })
            );
        });

        it('should override use theme passed as custom background mappings', () => {
            const customOptions = {
                basePath: './',
                mapBackgrounds: () => ({
                    'quote-slide': 'custom-value',
                }),
            };

            const result =
                _internals!._processBackgroundThemeOptions(customOptions);
            const mappings = result.mapBackgrounds();

            expect(mappings).toEqual(
                expect.objectContaining({
                    'quote-slide': 'custom-value',
                })
            );
        });

        it('should cache theme called is passed', () => {
            (manageTheme as Mock).mockReturnValue('tc');
            const theme = new TalkControlTheme(mockOptions);
            const mockAddEventListener = vi.spyOn(Reveal, 'addEventListener');

            theme.postprocess();

            // Simulate ready event
            const readyCallback = mockAddEventListener.mock
                .calls[0][1] as () => void;
            readyCallback();

            expect(customBackgrounds).toHaveBeenCalledWith(
                expect.objectContaining({
                    basePath: mockOptions.tcCustomBackgroundOptions.basePath,
                    theme: 'tc',
                })
            );
        });

        it('should return correct mapping if theme is passed', () => {
            const mockMapBackgrounds: (
                theme: string | undefined
            ) => TcCustomBackgroundMap = (theme: string | undefined) => {
                if (theme === 'theme-1') {
                    return {
                        'custom-key': 'custom-value',
                    };
                } else {
                    return {
                        'custom-key': 'custom-value-2',
                    };
                }
            };

            const customOptions = {
                basePath: './',
                mapBackgrounds: mockMapBackgrounds,
            };

            const result =
                _internals!._processBackgroundThemeOptions(customOptions);

            const mappingsTheme1 = result.mapBackgrounds('theme-1');
            const mappingsThemeDefault = result.mapBackgrounds();

            expect(mappingsTheme1).toEqual(
                expect.objectContaining({
                    'custom-key': 'custom-value',
                })
            );
            expect(mappingsThemeDefault).toEqual(
                expect.objectContaining({
                    'custom-key': 'custom-value-2',
                })
            );
        });
    });
});
