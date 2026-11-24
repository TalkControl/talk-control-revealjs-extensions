import { loadVendorStylesheet, waitForFonts } from '../utils/tc-vendor-loader';
import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';

/**
 * Lazy-loading for Font Awesome (issue #95, PR 4; issue #96).
 *
 * The pack used to import `@fortawesome/fontawesome-free/js/all.js`, its
 * `css/all.css` (fonts inlined as base64) and `free-brands-svg-icons`
 * statically, so everything was bundled for every consumer. It now works in
 * font mode only (the pack declares `htmlAttribute: 'class'`): the minified
 * stylesheet and the three woff2 fonts are vendored into
 * `dist/vendor/icons/font-awesome/` (see `scripts/vendor-manifest.ts`; the CSS
 * references `../webfonts/*.woff2`, so the `css/` + `webfonts/` layout is
 * kept) and only fetched once `fontAwesomeIconPack()` is configured.
 * `all.js` (SVG replacement) is no longer used.
 */
const STYLESHEET = 'icons/font-awesome/css/all.min.css';
const FONT_SPECS = [
    '900 1em "Font Awesome 6 Free"',
    '400 1em "Font Awesome 6 Free"',
    '400 1em "Font Awesome 6 Brands"',
];

let loadPromise: Promise<void> | undefined;

/**
 * Loads the stylesheet and waits for the fonts, exactly once (cached across
 * calls/instances). Never rejects: a failure is logged and resolved, so a
 * missing vendor folder never blocks slide rendering - icons are then simply
 * not displayed.
 */
function loadFontAwesome(): Promise<void> {
    if (!loadPromise) {
        loadPromise = loadVendorStylesheet(STYLESHEET)
            .then(() => waitForFonts(FONT_SPECS))
            .catch((cause: unknown) => {
                console.error(
                    'TalkControl: failed to load Font Awesome. Font Awesome icons will not be rendered.',
                    cause
                );
            });
    }
    return loadPromise;
}

export function fontAwesomeIconPack(): MarkedTcIconsOptions {
    return {
        keyword: 'fa',
        copyKeyword: 'fa-copy',
        includesKeyword: true,
        htmlAttribute: 'class',
        ensureLoaded: loadFontAwesome,
    };
}

function resetFontAwesomeCache(): void {
    loadPromise = undefined;
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              resetFontAwesomeCache,
          }
        : undefined;
