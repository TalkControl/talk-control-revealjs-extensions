import { _handle_parameter } from '../helper';

export interface TcThemeOptions {
    defaultTheme?: string;
}

/**
 * Function that gives the path with translate extension if needed
 * @param {string[]} slides : array of paths of slides
 * @returns a Promise that returns a string[] with the correct suffix for internationalization
 */
export function manageTheme({ defaultTheme = '' }: TcThemeOptions): string {
    const urlParams = new URLSearchParams(window.location.search);
    const slideElement: HTMLElement =
        document.querySelector('.reveal .slides')!;
    const theme = _handle_parameter(
        urlParams,
        'data-theme',
        slideElement,
        'data-theme',
        defaultTheme
    );

    slideElement.setAttribute('data-theme', theme);
    return theme;
}
