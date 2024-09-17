import { html, render } from 'lit-html';

import Reveal from 'reveal.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm';
import RevealTalkControlThemePlugin from './theme-plugin';
import RevealZoom from 'reveal.js/plugin/zoom/zoom.esm';
import { SlidePath } from './models';

export const ThemeInitializer = {
    /**
     * @param {() => Array.<string>} slidesFactory
     */
    async init(
        slidesFactory: () => SlidePath[],
        slidesRenderer = defaultSlideRenderer,
    ) {
        const importSlideElement: HTMLElement | null =
            document.querySelector('.slides');
        if (importSlideElement == null) return;

        // Retrieve the slide path list
        const slides = slidesFactory();

        // Generate all the DOM code corresponding to slides
        await slidesRenderer(importSlideElement, slides);

        // Notes aren't shown by default
        const { enableShowNotes, pdfMaxPagesPerSlide, pdfSeparateFragments } =
            checkPdfConfiguration(importSlideElement);

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
            showNotes: enableShowNotes as boolean, // Hack to pass compiler due to wrong typing
            pdfMaxPagesPerSlide: pdfMaxPagesPerSlide,
            pdfSeparateFragments: pdfSeparateFragments,
            plugins: [
                RevealMarkdown,
                RevealTalkControlThemePlugin,
                RevealZoom,
                RevealNotes,
                RevealHighlight,
            ],
        }).then(() => {
            Reveal.configure({
                transition:
                    (Reveal.getQueryHash().transition as
                        | 'none'
                        | 'slide'
                        | 'concave'
                        | 'zoom'
                        | 'fade') || 'none', // default/cube/page/concave/zoom/linear/fade/none
            });
        });
    },
};

/**
 * Render the html
 */
async function defaultSlideRenderer(element: HTMLElement, slides: SlidePath[]) {
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
                `,
            )}
        `,
        element,
    );
}

/**
 * Check the pdf configuration to apply it
 * @param {HTMLElement} importSlideElement
 * @returns the configuration variables to apply
 */
function checkPdfConfiguration(importSlideElement: HTMLElement) {
    const urlParams = new URLSearchParams(window.location.search);

    // Notes aren't shown by default
    // eg. <div class="slides"/>
    // or  <div class="slides" data-show-notes="any other value" />
    let enableShowNotes: boolean | string | undefined = false;
    if (urlParams.has('show-notes')) {
        const urlValue = urlParams.get('show-notes');
        importSlideElement.dataset.showNotes = urlValue ?? 'true';
    }
    if (importSlideElement.dataset.showNotes == 'separate-page') {
        // eg. <div class="slides" data-show-notes="separate-page"/>
        enableShowNotes = 'separate-page';
    } else if (importSlideElement.dataset.showNotes == '') {
        // eg. <div class="slides" data-show-notes/>
        enableShowNotes = true;
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

    return { enableShowNotes, pdfMaxPagesPerSlide, pdfSeparateFragments };
}
