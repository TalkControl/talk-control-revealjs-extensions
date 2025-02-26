/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Reveal from 'reveal.js';
import { ThemeInitializer } from './theme-initializer';
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

vi.mock('./addons/tc-i18n', () => ({
    i18n: vi.fn().mockImplementation(() => []),
}));

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
        baseMarkdownPath: '/markdwon',
    };
    const mockOptions = {
        slidesFactory: mockSlidesFactory,
        tcMarkedOptions: mockTcMarkedOptions,
        tcI18nOptions: mockTcI18nOptions,
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

            await ThemeInitializer.init(mockOptions);

            expect(Reveal.initialize).not.toHaveBeenCalled();
            expect(render).not.toHaveBeenCalled();
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

        it('should call slidesFactory and renderer', async () => {
            await ThemeInitializer.init(mockOptions);

            expect(mockSlidesFactory).toHaveBeenCalled();
            expect(render).toHaveBeenCalledWith(
                expect.anything(),
                slidesElement
            );
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
