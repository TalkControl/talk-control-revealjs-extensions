import Reveal, { PluginFunction } from 'reveal.js';
import {
    TcCustomBackgroundMap,
    TcCustomBackgroundOptions,
    customBackgrounds,
} from './addons/tc-custom-background';
import { TcThemeOptions, manageTheme } from './addons/tc-theme';
import { MarkedTcIconsOptions } from './marked/marked-tc-icons';
import { TalkControlMarkedOptions } from './marked/tc-marked-plugin';
import { manageCopyClipboard } from './addons/tc-copy-clipboard';
import { manageMultiplesColumns } from './addons/tc-multiples-cols';
import { manageShowTypeContent } from './addons/tc-data-type';
import { transformListFragment } from './addons/tc-list-fragment';

/**
 * Default mapping to use for background
 * Key is a class style of section
 * Value is the applied background
 */
const backgroundMapping = {
    'quote-slide': 'var(--tc-quote-slide-bg-color)',
};
export interface TalkControlPluginOptions {
    tcCustomBackgroundOptions: TcCustomBackgroundOptions; // Deal with the custom background options
    tcMarkedOptions: TalkControlMarkedOptions; // Deal with the font icons
    activeCopyClipboard?: boolean; // Default applied is true
    tcThemeOptions: TcThemeOptions; // Deal with the theme options
    defaultSlidesType?: string; // Default applied is "on-stage"
}
export class TalkControlTheme {
    path: string = '';
    urlParams: URLSearchParams;
    slidesElement: HTMLElement | null;
    options: TalkControlPluginOptions;

    private optionsCustomBackground: TcCustomBackgroundOptions;

    private themeToUse: string;

    constructor(options: TalkControlPluginOptions) {
        this.options = options;
        this.path = '';

        const queryString = window.location.search;
        this.urlParams = new URLSearchParams(queryString);

        this.themeToUse = manageTheme(options.tcThemeOptions);

        this.optionsCustomBackground = _processBackgroundThemeOptions(
            options.tcCustomBackgroundOptions
        );

        this.slidesElement = document.querySelector('.reveal .slides');
        if (!this.slidesElement) return;
    }

    postprocess() {
        this.path = this.extractPath();

        Reveal.addEventListener('ready', () => {
            transformListFragment();
            manageMultiplesColumns();
            customBackgrounds({
                ...this.optionsCustomBackground,
                theme: this.themeToUse,
            });
            manageShowTypeContent(this.options.defaultSlidesType);

            // Deal with font icons to select the first one as "copy clipboard"
            const tcMarkedFontIcons: MarkedTcIconsOptions | undefined =
                this.options.tcMarkedOptions.fontIcons &&
                this.options.tcMarkedOptions.fontIcons.length > 0
                    ? this.options.tcMarkedOptions.fontIcons[0]
                    : undefined;
            if (tcMarkedFontIcons) {
                manageCopyClipboard({
                    active: this.options.activeCopyClipboard,
                    tcIconOption: tcMarkedFontIcons,
                });
            }
        });
    }

    private extractPath() {
        const links = document.getElementsByTagName('link');

        for (let idx = 0; idx < links.length; idx++) {
            const link = links.item(idx);

            if (link?.href?.match(/talk-control-reavealjs-theme\.css$/)) {
                const path = link.href;
                return path.substring(
                    0,
                    path.indexOf('css/talk-control-reavealjs-theme.css')
                );
            }
        }
        return '';
    }
}
/**
 * Override function that prioritize the mapping offered in parameters
 * and apply default background includes in theme (quote, ...)
 * @param backgroundOptions
 * @returns
 */
function _processBackgroundThemeOptions(
    backgroundOptions: TcCustomBackgroundOptions
): TcCustomBackgroundOptions {
    const saveMapThemeBg = new Map<string, TcCustomBackgroundMap>();

    const overrideMapBackground = (theme?: string) => {
        const themeToUse = theme ?? 'default';
        if (saveMapThemeBg.has(themeToUse)) {
            return saveMapThemeBg.get(themeToUse)!;
        } else {
            const givenBackgroundOptions =
                backgroundOptions.mapBackgrounds(themeToUse);
            const applyBackgroundOptions: TcCustomBackgroundMap = {
                ...backgroundMapping,
            };
            for (const [key, value] of Object.entries(givenBackgroundOptions)) {
                applyBackgroundOptions[key] = value;
            }
            saveMapThemeBg.set(themeToUse, applyBackgroundOptions);
            return applyBackgroundOptions;
        }
    };
    return {
        ...backgroundOptions,
        mapBackgrounds: overrideMapBackground,
    };
}

const RevealTalkControlThemePlugin: (
    options: TalkControlPluginOptions
) => PluginFunction = (options: TalkControlPluginOptions) => {
    const savedOptions = options;
    return () => {
        return {
            id: 'talk-control-theme',
            init() {
                const talkControlTheme = new TalkControlTheme(savedOptions);
                talkControlTheme.postprocess();
            },
        };
    };
};
export default RevealTalkControlThemePlugin;

// Add conditionnal export for test
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              _processBackgroundThemeOptions,
          }
        : undefined;
