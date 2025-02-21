import { SlidePath } from "../models";
import { _handle_parameter } from "../helper";

/**
 * Function that gives the path with translate extension if needed
 * @param {string[]} slides : array of paths of slides
 * @returns a Promise that returns a string[] with the correct suffix for internationalization
 */
export async function i18n(slides: SlidePath[], baseMarkdownPath: string, defaultLang: string = 'EN'): Promise<SlidePath[]> {
    const urlParams = new URLSearchParams(window.location.search);
    const slideElement: HTMLElement = document.querySelector('.reveal .slides')!;
    const language = _handle_parameter(
        urlParams,
        'data-lang',
        slideElement,
        'data-lang',
        defaultLang
    );

    // If the language is French, we don't need to translate (because default language)
    if (language === defaultLang) return Promise.resolve(slides);


    const slidesPathToUse = [];
    for (const slidePath of slides) {
        const tmp = slidePath.path.substring(0, slidePath.path.length - 3);
        const slidePathSelected = await firstExisting(
            baseMarkdownPath,
            { path: `${tmp}.${language.toUpperCase()}.md` },
            { path: `${tmp}.md` }
        );
        if (slidePathSelected) {
            slidesPathToUse.push(slidePathSelected);
        }
    }
    return slidesPathToUse;
}

/**
 * Check in order of given paths if they are available (path for markdown file)
 * @param  {...string} slidePaths : files to check (order is important !)
 * @returns the path that return a 200 status null else
 */
async function firstExisting(baseMarkdownPath: string, ...slidePaths: SlidePath[]): Promise<SlidePath | null> {
    for (const slidePath of slidePaths) {
        try {
            const response = await fetch(baseMarkdownPath + slidePath.path, { method: 'HEAD' });
            if (response.status === 200) {
                return slidePath;
            }
        } catch (e) {
            // Nothing to do
        }
    }
    return null;
}

// Ajout de l'export conditionnel
export const _internals = process.env.NODE_ENV === 'test' ? {
    firstExisting
} : undefined;