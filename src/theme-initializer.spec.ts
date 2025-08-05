/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TYPE } from './utils/const';
import Reveal from 'reveal.js';
import { ThemeInitializer } from './theme-initializer';
import { manageMultiplesColumns } from './addons/tc-multiples-cols';
import { render } from 'lit-html';
// Mocks
vi.mock('reveal.js', () => ({
    default: {
        initialize: vi.fn().mockResolvedValue(undefined),
        configure: vi.fn(),
        getQueryHash: vi.fn().mockReturnValue({}),
    },
}));

vi.mock('lit-html', () => ({
    html: (strings: TemplateStringsArray, ...values: unknown[]) => ({
        strings,
        values,
    }),
    render: vi.fn(),
}));

vi.mock('./tc-marked-plugin', () => ({
    RevealTalkControlMarkdownPlugin: vi.fn().mockImplementation(() => ({
        getPlugin: vi.fn().mockReturnValue({}),
    })),
}));

vi.mock('./theme-plugin', () => {
    return {
        default: vi.fn(() => {
            return () => ({
                id: 'talk-control-theme',
                init: vi.fn(),
            });
        }),
        TalkControlTheme: vi.fn().mockImplementation(() => ({
            postprocess: vi.fn(),
        })),
    };
});

vi.mock('./addons/tc-i18n', () => ({
    i18n: vi.fn().mockImplementation(() => []),
}));

vi.mock('./utils/storage-service', () => ({
    getSlidesToUse: vi
        .fn()
        .mockImplementation(() => [
            { path: 'slide1.md' },
            { path: 'slide2.md' },
        ]),
}));

vi.mock('./addons/tc-data-type', () => ({
    getShowType: vi.fn().mockImplementation(() => DEFAULT_TYPE),
}));

vi.mock('./addons/tc-multiples-cols', () => ({
    manageMultiplesColumns: vi.fn(),
}));

vi.mock('./addons/tc-ui-config');

// Get a representation of this mock class
const I18nMocked = vi.mocked(await import('./addons/tc-i18n'));
const ThemeMocked = vi.mocked(await import('./theme-plugin'));

describe('ThemeInitializer', () => {
    let slidesElement: HTMLElement;
    const mockSlides = [{ path: 'slide1.md' }, { path: 'slide2.md' }];
    const mockSlidesFactory = vi.fn();
    mockSlidesFactory.mockReturnValue(mockSlides);
    const mockTcMarkedOptions = {
        knowStyles: ['style1'],
        fontIcons: [],
    };
    const mockTcI18nOptions = {
        defaultLang: 'EN',
        baseMarkdownPath: '/markdown',
    };
    const mockCustomBackgroundOptions = {
        basePath: './',
        mapBackgrounds: () => {
            return {
                'slide-1': 'image.jpg',
            };
        },
    };
    const mockTcThemeOptions = {
        defaultTheme: '',
    };
    const mockOptions = {
        activeCopyClipboard: true,
        slidesFactory: mockSlidesFactory,
        tcMarkedOptions: mockTcMarkedOptions,
        tcI18nOptions: mockTcI18nOptions,
        tcThemeOptions: mockTcThemeOptions,
        tcCustomBackgroundOptions: mockCustomBackgroundOptions,
        defaultSlidesType: 'on-stage',
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup DOM
        document.body.innerHTML = '<div class="slides"></div>';
        slidesElement = document.querySelector('.slides')!;
    });

    describe('init', () => {
        it('should return early if no .slides elements', async () => {
            document.body.innerHTML = '';

            try {
                await ThemeInitializer.init(mockOptions);
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('No slides found');
            }
        });
        it('should return early if no slidesFactory', async () => {
            document.body.innerHTML = '';

            try {
                // Use any here to force giving an incomplete parameters (method ask in javascript)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (ThemeInitializer as any).init({});
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('No slide factory function');
            }
        });

        it('should init Reveal.js with correct default options even if there is just the slide factory', async () => {
            await ThemeInitializer.init({
                slidesFactory: mockSlidesFactory,
            });

            expect(Reveal.initialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    controls: true,
                    progress: true,
                    history: true,
                    center: false,
                    width: 1920,
                    height: 1080,
                    slideNumber: 'c/t',
                    showSlideNumber: 'speaker',
                    showNotes: false,
                    pdfMaxPagesPerSlide: 1,
                    pdfSeparateFragments: true,
                })
            );
        });
        it('should init Reveal.js with correct default options', async () => {
            await ThemeInitializer.init(mockOptions);

            expect(Reveal.initialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    controls: true,
                    progress: true,
                    history: true,
                    center: false,
                    width: 1920,
                    height: 1080,
                    slideNumber: 'c/t',
                    showSlideNumber: 'speaker',
                    showNotes: false,
                    pdfMaxPagesPerSlide: 1,
                    pdfSeparateFragments: true,
                })
            );
        });

        it('should call slidesFactory', async () => {
            await ThemeInitializer.init(mockOptions);

            expect(mockSlidesFactory).toHaveBeenCalled();
        });
        it('should call renderer', async () => {
            await ThemeInitializer.init(mockOptions);

            expect(render).toHaveBeenCalledWith(
                expect.anything(),
                slidesElement
            );
        });
        it('should call i18n', async () => {
            await ThemeInitializer.init(mockOptions);

            expect(I18nMocked.i18n).toHaveBeenCalledWith({
                defaultLang: mockTcI18nOptions.defaultLang,
                slides: mockSlides,
                baseMarkdownPath: mockTcI18nOptions.baseMarkdownPath,
            });
        });

        it('should call multiple columns', async () => {
            await ThemeInitializer.init(mockOptions);

            expect(manageMultiplesColumns).toHaveBeenCalled();
        });
        it('should call Plugin with correct params', async () => {
            await ThemeInitializer.init(mockOptions);

            expect(ThemeMocked.default).toHaveBeenCalledWith({
                activeCopyClipboard: mockOptions.activeCopyClipboard,
                tcCustomBackgroundOptions: mockCustomBackgroundOptions,
                tcThemeOptions: mockTcThemeOptions,
                tcMarkedOptions: mockTcMarkedOptions,
                defaultSlidesType: mockOptions.defaultSlidesType,
            });
        });

        it('should call Plugin with correct params and empty values', async () => {
            const mockOptionsWithEmptyValues = {
                slidesFactory: mockSlidesFactory,
                tcMarkedOptions: mockTcMarkedOptions,
                tcI18nOptions: mockTcI18nOptions,
                tcThemeOptions: mockTcThemeOptions,
                tcCustomBackgroundOptions: mockCustomBackgroundOptions,
            };
            await ThemeInitializer.init(mockOptionsWithEmptyValues);

            expect(ThemeMocked.default).toHaveBeenCalledWith({
                activeCopyClipboard: true,
                tcCustomBackgroundOptions: mockCustomBackgroundOptions,
                tcThemeOptions: mockTcThemeOptions,
                tcMarkedOptions: mockTcMarkedOptions,
                defaultSlidesType: undefined,
            });
        });
    });

    describe('PDF Configuration', () => {
        it('should configure shownotes from URL', async () => {
            // Simuler un paramètre URL
            const searchParams = new URLSearchParams(
                '?show-notes=separate-page'
            );
            vi.spyOn(window, 'location', 'get').mockReturnValue({
                ...window.location,
                search: searchParams.toString(),
            });

            await ThemeInitializer.init(mockOptions);

            expect(Reveal.initialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    showNotes: 'separate-page',
                })
            );
        });

        it('should configure pdfMaxPagesPerSlides from data attributes', async () => {
            slidesElement.dataset.pdfMaxPagesPerSlide = '3';

            await ThemeInitializer.init(mockOptions);

            expect(Reveal.initialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    pdfMaxPagesPerSlide: 3,
                })
            );
        });

        it('should configure pdfSeperateFragments from data attributes', async () => {
            slidesElement.dataset.pdfDontSeparateFragments = '';

            await ThemeInitializer.init(mockOptions);

            expect(Reveal.initialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    pdfSeparateFragments: false,
                })
            );
        });
    });
});
