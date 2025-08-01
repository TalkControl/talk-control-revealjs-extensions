import { DEFAULT_LANGUAGE, DEFAULT_THEME, DEFAULT_TYPE } from './utils/const';
import {
    RevealTalkControlMarkdownPlugin,
    TalkControlMarkedOptions,
} from './marked/tc-marked-plugin';
import { RootPart, html, render } from 'lit-html';
import { TcI18nConfig, i18n } from './addons/tc-i18n';

import Reveal from 'reveal.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm';
import RevealTalkControlThemePlugin from './theme-plugin';
import RevealZoom from 'reveal.js/plugin/zoom/zoom.esm';

import { SlidePath } from './models';
import { TcCustomBackgroundOptions } from './addons/tc-custom-background';
import { TcThemeOptions } from './addons/tc-theme';
import { TcUiConfig } from './addons/tc-ui-config';
import { getShowType } from './addons/tc-data-type';
import { getSlidesToUse } from './utils/storage-service';

/**
 * Default values to let undefined in options and simplify the usage
 */

const DEFAULT_CUSTOM_BACKGROUND: TcCustomBackgroundOptions = {
    basePath: './',
    mapBackgrounds: () => {
        return {};
    },
};

const DEFAULT_MARKED_OPTIONS: TalkControlMarkedOptions = {};

const DEFAULT_I18N_OPTIONS: TcI18nConfig = {
    baseMarkdownPath: 'markdown',
};

const DEFAULT_THEME_OPTIONS = {};

/**
 *
 */
export interface ThemeInitializerOptions {
    slidesFactory: (showType?: string) => SlidePath[]; // Function to retrieve the slides informations
    activeCopyClipboard?: boolean; // Default applied is true
    tcMarkedOptions?: TalkControlMarkedOptions; // Deal with the font icons
    tcI18nOptions?: TcI18nConfig; // Deal with the i18n options
    tcCustomBackgroundOptions?: TcCustomBackgroundOptions; // Deal with the custom background options
    tcThemeOptions?: TcThemeOptions; // Deal with the theme options
    slidesRenderer?: (element: HTMLElement, slides: SlidePath[]) => RootPart; // Function to render the slides defautl use litHTML
    defaultSlidesType?: string; // Default applied is "on-stage"
}

export const ThemeInitializer = {
    /**
     * @param {() => Array.<string>} slidesFactory
     */
    async init({
        activeCopyClipboard = true,
        slidesFactory,
        tcMarkedOptions = DEFAULT_MARKED_OPTIONS,
        tcI18nOptions = DEFAULT_I18N_OPTIONS,
        tcCustomBackgroundOptions = DEFAULT_CUSTOM_BACKGROUND,
        tcThemeOptions = DEFAULT_THEME_OPTIONS,
        defaultSlidesType,
        slidesRenderer = defaultSlideRenderer,
    }: ThemeInitializerOptions) {
        if (!slidesFactory) {
            throw new Error('No slide factory function');
        }

        const importSlideElement: HTMLElement | null =
            document.querySelector('.slides');
        if (importSlideElement == null) throw new Error('No slides found');

        // Retrieve the data type parameter to apply to a subset of slides
        const showType = getShowType(defaultSlidesType);

        // Retrieve the slide path list
        const slides = slidesFactory(showType);

        // Init the uiConfig
        new TcUiConfig(
            slides,
            tcI18nOptions.defaultLang ?? DEFAULT_LANGUAGE,
            tcThemeOptions.defaultTheme ?? DEFAULT_THEME,
            defaultSlidesType ?? DEFAULT_TYPE
        );

        // Check if we use a subset store in the session storage
        const slidesToUse = getSlidesToUse(slides);

        const { baseMarkdownPath, defaultLang } = tcI18nOptions;
        const slideI18n = await i18n({
            slides: slidesToUse,
            baseMarkdownPath,
            defaultLang,
        });

        // Generate all the DOM code corresponding to slides
        await slidesRenderer(importSlideElement, slideI18n);

        // Notes aren't shown by default
        const { showNotes, pdfMaxPagesPerSlide, pdfSeparateFragments } =
            checkPdfConfiguration(importSlideElement);

        const talkControlMarkedPlugin = new RevealTalkControlMarkdownPlugin(
            tcMarkedOptions
        );

        // Init the Reveal Engine
        Reveal.initialize({
            controls: true,
            progress: true,
            history: true,
            center: false,
            width: 1920,
            height: 1080,
            slideNumber: 'c/t',
            showSlideNumber: 'speaker',
            showNotes,
            pdfMaxPagesPerSlide,
            pdfSeparateFragments,
            plugins: [
                talkControlMarkedPlugin.getPlugin(), // We don't use RevealMarkdown because we have to add custom marked extensions
                RevealTalkControlThemePlugin({
                    activeCopyClipboard,
                    tcCustomBackgroundOptions,
                    tcMarkedOptions,
                    tcThemeOptions,
                    defaultSlidesType,
                }),
                RevealZoom,
                RevealNotes,
                RevealHighlight,
            ],
        }).then(() => {
            Reveal.configure({
                transition:
                    (Reveal.getQueryHash()
                        .transition as Reveal.Options['transition']) ?? 'none', // default/cube/page/concave/zoom/linear/fade/none
            });
        });
    },
};

/**
 * Render the html
 */
function defaultSlideRenderer(
    element: HTMLElement,
    slides: SlidePath[]
): RootPart {
    const slidesToRender = slides;

    return render(
        html`
            ${slidesToRender.map(
                (slide) => html`
                    <section
                        data-markdown="./markdown/${slide.path}"
                        data-separator="##==##"
                        data-separator-vertical="##--##"
                        data-separator-notes="^Notes:"></section>
                `
            )}
        `,
        element
    );
}

type CheckPdfConfigurationResult = Pick<
    Reveal.Options,
    'showNotes' | 'pdfMaxPagesPerSlide' | 'pdfSeparateFragments'
>;

/**
 * Check the pdf configuration to apply it
 * @param {HTMLElement} importSlideElement
 * @returns the configuration variables to apply
 */
function checkPdfConfiguration(
    importSlideElement: HTMLElement
): CheckPdfConfigurationResult {
    const urlParams = new URLSearchParams(window.location.search);

    // Notes aren't shown by default
    // eg. <div class="slides"/>
    // or  <div class="slides" data-show-notes="any other value" />
    let showNotes: CheckPdfConfigurationResult['showNotes'] = false;
    if (urlParams.has('show-notes')) {
        const urlValue = urlParams.get('show-notes');
        importSlideElement.dataset.showNotes = urlValue ?? 'true';
    }
    if (importSlideElement.dataset.showNotes == 'separate-page') {
        // eg. <div class="slides" data-show-notes="separate-page"/>
        // TODO: remove this cast when this cast when this PR will be merged
        // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/70587
        showNotes = 'separate-page' as unknown as boolean;
    } else if (importSlideElement.dataset.showNotes == '') {
        // eg. <div class="slides" data-show-notes/>
        showNotes = true;
    }

    // No max pages per slide by default
    // eg. <div class="slides"/>
    let pdfMaxPagesPerSlide = 1;
    if (urlParams.has('pdf-max-pages-per-slide')) {
        const urlValue = urlParams.get('pdf-max-pages-per-slide');
        importSlideElement.dataset.pdfMaxPagesPerSlide = `${urlValue ? +urlValue : 0}`;
    }
    if (importSlideElement.dataset.pdfMaxPagesPerSlide != null) {
        // eg. <div class="slides" data-pdf-max-pages-per-slide="<number>"/>
        pdfMaxPagesPerSlide = +importSlideElement.dataset.pdfMaxPagesPerSlide;
    }

    // Fragments are separated by default
    // eg. <div class="slides"/>
    let pdfSeparateFragments = true;
    if (urlParams.has('pdf-dont-separate-fragments')) {
        importSlideElement.dataset.pdfDontSeparateFragments = 'true';
    }
    if (importSlideElement.dataset.pdfDontSeparateFragments == '') {
        // eg. <div class="slides" data-pdf-dont-separate-fragments/>
        pdfSeparateFragments = false;
    }

    return { showNotes, pdfMaxPagesPerSlide, pdfSeparateFragments };
}
