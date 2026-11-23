import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';
import { loadVendorScript } from '../utils/tc-vendor-loader';

/**
 * Lazy-loading for Feather Icons (issue #95, PR 2).
 *
 * `feather-icons` has no CSS/webfonts - it's pure JS that bakes every icon's
 * SVG path into the bundle and replaces `<i data-feather="...">` elements
 * with inline SVG via `feather.replace()`. Left as a static import, that JS
 * would be bundled unconditionally into both dist outputs even for a
 * consumer who never calls `featherIconPack()`.
 *
 * Its published package only ships a UMD/CJS build (no ES module), so it
 * cannot go through `loadVendorModule`. Instead its `feather.min.js` is
 * vendored into `dist/vendor/icons/feather/` (see `scripts/vendor-manifest.ts`)
 * and injected as a classic `<script>` by `loadVendorScript`, which exposes
 * the library as the `window.feather` global. Nothing from `feather-icons`
 * is statically imported here (type-only import below), so it is absent from
 * both the ESM and the UMD bundles.
 */
type FeatherLib = typeof import('feather-icons');

const FEATHER_VENDOR_PATH = 'icons/feather/dist/feather.min.js';

let featherPromise: Promise<FeatherLib | undefined> | undefined;

/**
 * Loads the vendored Feather script exactly once (cached across
 * calls/instances) and never rejects: a failed load is logged and resolves
 * to `undefined`, so a missing vendor folder never blocks slide rendering -
 * icons are simply not replaced.
 */
function loadFeather(): Promise<FeatherLib | undefined> {
    if (!featherPromise) {
        featherPromise = loadVendorScript(FEATHER_VENDOR_PATH)
            .then(() => {
                const lib = (window as unknown as { feather?: FeatherLib })
                    .feather;
                if (!lib) {
                    throw new Error(
                        'The Feather script loaded but did not expose `window.feather`.'
                    );
                }
                return lib;
            })
            .catch((cause: unknown) => {
                console.error(
                    'TalkControl: failed to load Feather Icons. Feather icons will not be rendered.',
                    cause
                );
                return undefined;
            });
    }
    return featherPromise;
}

export function featherIconPack(): MarkedTcIconsOptions {
    let feather: FeatherLib | undefined;

    return {
        keyword: 'feather',
        copyKeyword: 'copy',
        htmlAttribute: 'data-feather',
        ensureLoaded: async () => {
            feather = await loadFeather();
        },
        initFunction: () => {
            feather?.replace();
        },
    };
}

function resetFeatherCache(): void {
    featherPromise = undefined;
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              resetFeatherCache,
          }
        : undefined;
