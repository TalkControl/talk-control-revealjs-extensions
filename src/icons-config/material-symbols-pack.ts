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
 * By default all three families are loaded; `variants` (#97) restricts the
 * pack to the families actually used. An icon class of a variant that is not
 * loaded is rendered as plain text (its ligature name).
 */
const VENDOR_DIR = 'icons/material-symbols';

export type MaterialSymbolsVariant = 'outlined' | 'rounded' | 'sharp';

const VARIANT_FONTS: Record<MaterialSymbolsVariant, string> = {
    outlined: '1em "Material Symbols Outlined"',
    rounded: '1em "Material Symbols Rounded"',
    sharp: '1em "Material Symbols Sharp"',
};
const ALL_VARIANTS = Object.keys(VARIANT_FONTS) as MaterialSymbolsVariant[];

export interface MaterialSymbolsPackOptions {
    /**
     * Families to load. Defaults to all three. Unknown values are ignored
     * with a warning; an empty (or fully invalid) list falls back to the
     * default.
     */
    variants?: MaterialSymbolsVariant[];
}

// One cached load per variant, so packs with different variants never mask
// each other and a given family is fetched at most once.
const loadPromises = new Map<MaterialSymbolsVariant, Promise<void>>();

/**
 * Loads a variant's stylesheet and waits for its font, exactly once (cached
 * across calls/instances). Never rejects: a failure is logged and resolved,
 * so a missing vendor folder never blocks slide rendering - icons then show
 * as plain text.
 */
function loadVariant(variant: MaterialSymbolsVariant): Promise<void> {
    let promise = loadPromises.get(variant);
    if (!promise) {
        promise = loadVendorStylesheet(`${VENDOR_DIR}/${variant}.css`)
            .then(() => waitForFonts([VARIANT_FONTS[variant]]))
            .catch((cause: unknown) => {
                console.error(
                    `TalkControl: failed to load Material Symbols (${variant}). These icons will not be rendered.`,
                    cause
                );
            });
        loadPromises.set(variant, promise);
    }
    return promise;
}

function resolveVariants(
    variants: MaterialSymbolsVariant[] | undefined
): MaterialSymbolsVariant[] {
    if (variants === undefined) return ALL_VARIANTS;
    const valid = [...new Set(variants)].filter((v) =>
        ALL_VARIANTS.includes(v)
    );
    const invalid = variants.filter((v) => !ALL_VARIANTS.includes(v));
    if (invalid.length > 0) {
        console.warn(
            `TalkControl: unknown Material Symbols variant(s) ignored: ${invalid.map(String).join(', ')}. Expected: ${ALL_VARIANTS.join(', ')}.`
        );
    }
    if (valid.length === 0) {
        console.warn(
            'TalkControl: no valid Material Symbols variant requested, loading all of them.'
        );
        return ALL_VARIANTS;
    }
    return valid;
}

export function materialSymbolsIconPack(
    options: MaterialSymbolsPackOptions = {}
): MarkedTcIconsOptions {
    const variants = resolveVariants(options.variants);
    return {
        keyword: 'material-symbols',
        copyKeyword: 'content_copy',
        htmlAttribute: 'class',
        iconInTag: true,
        ensureLoaded: () =>
            Promise.all(variants.map(loadVariant)).then(() => {}),
    };
}

function resetMaterialSymbolsCache(): void {
    loadPromises.clear();
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              resetMaterialSymbolsCache,
          }
        : undefined;
