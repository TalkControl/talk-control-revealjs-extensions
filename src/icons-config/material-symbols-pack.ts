import { loadVendorStylesheet, waitForFonts } from '../utils/tc-vendor-loader';
import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';

/**
 * Lazy-loading for Material Symbols (issue #95, PR 3).
 *
 * The `material-symbols` package used to be imported statically, which
 * inlined ~14.7 MB of base64 fonts into the theme CSS for every consumer.
 * Its three stylesheets and woff2 fonts are now vendored into
 * `dist/vendor/icons/material-symbols/` (see `scripts/vendor-manifest.ts`;
 * the CSS reference the fonts with relative `url("./*.woff2")`, so they keep
 * resolving after the copy) and only fetched once `materialSymbolsIconPack()`
 * is configured.
 *
 * All three families are loaded for now, as before; choosing variants is #97.
 */
const VENDOR_DIR = 'icons/material-symbols';
const STYLESHEETS = ['outlined.css', 'rounded.css', 'sharp.css'];
const FONT_SPECS = [
    '1em "Material Symbols Outlined"',
    '1em "Material Symbols Rounded"',
    '1em "Material Symbols Sharp"',
];

let loadPromise: Promise<void> | undefined;

/**
 * Loads the stylesheets and waits for the fonts, exactly once (cached across
 * calls/instances). Never rejects: a failure is logged and resolved, so a
 * missing vendor folder never blocks slide rendering - icons then show as
 * plain text.
 */
function loadMaterialSymbols(): Promise<void> {
    if (!loadPromise) {
        loadPromise = Promise.all(
            STYLESHEETS.map((file) =>
                loadVendorStylesheet(`${VENDOR_DIR}/${file}`)
            )
        )
            .then(() => waitForFonts(FONT_SPECS))
            .catch((cause: unknown) => {
                console.error(
                    'TalkControl: failed to load Material Symbols. Material Symbols icons will not be rendered.',
                    cause
                );
            });
    }
    return loadPromise;
}

export function materialSymbolsIconPack(): MarkedTcIconsOptions {
    return {
        keyword: 'material-symbols',
        copyKeyword: 'content_copy',
        htmlAttribute: 'class',
        iconInTag: true,
        ensureLoaded: loadMaterialSymbols,
    };
}

function resetMaterialSymbolsCache(): void {
    loadPromise = undefined;
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              resetMaterialSymbolsCache,
          }
        : undefined;
