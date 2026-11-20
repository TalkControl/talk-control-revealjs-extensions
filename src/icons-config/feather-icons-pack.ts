import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';

/**
 * Lazy-loading for Feather Icons (issue #95, PR 2).
 *
 * `feather-icons` has no CSS/webfonts - it's pure JS that bakes every icon's
 * SVG path into the bundle and replaces `<i data-feather="...">` elements
 * with inline SVG via `feather.replace()`. Left as a static
 * `import feather from 'feather-icons'`, that JS is bundled unconditionally
 * into both dist outputs even for a consumer who never calls
 * `featherIconPack()`.
 *
 * Why a plain dynamic `import('feather-icons')` and not `tc-vendor-loader`'s
 * `loadVendorModule` (the route #92/Mermaid and PR 3/4's font packs use):
 * `feather-icons`' published package has only a `main` (CJS/UMD) build - no
 * `module`/`exports` field, so there is no ESM file to vendor and `import()`
 * at a `dist/vendor/...` URL (`loadVendorModule` requires real ESM at the
 * resolved URL). A bare `import('feather-icons')` of the npm package itself
 * works today and lets Rollup/Vite code-split it into its own lazy chunk for
 * the **ESM** build. It does **not** shrink the **UMD** build: Rollup's UMD
 * output format has no code-splitting, so anything only reachable via a
 * runtime-constructed vendor URL is invisible to the bundler (that trick
 * works for Mermaid), but a bare dynamic `import('feather-icons')` is
 * *statically* reachable by the bundler and gets inlined into the single
 * UMD file regardless. This is a known, accepted limitation for UMD
 * consumers - see `docs/vendor.md`. Vendoring Feather's UMD build and
 * reinstating a classic-`<script>` loader (reverting PR1's removal of
 * `loadVendorScript`) would fix the UMD case too, but was judged not worth
 * the added mechanism for one icon pack; revisit if PR 3/4 end up needing a
 * classic-script loader anyway for an unrelated reason.
 */
type FeatherModule = typeof import('feather-icons');

let featherModulePromise: Promise<FeatherModule> | undefined;

/**
 * Loads `feather-icons` exactly once (cached across calls/instances) and
 * never rejects: a failed load is logged and resolves anyway, so a missing
 * Feather module never blocks slide rendering - icons are simply not
 * replaced (`initFunction` becomes a no-op until a later successful load).
 */
function loadFeather(): Promise<FeatherModule | undefined> {
    if (!featherModulePromise) {
        featherModulePromise = import('feather-icons').catch(
            (cause: unknown) => {
                featherModulePromise = undefined;
                throw cause;
            }
        );
    }
    return featherModulePromise.catch((cause: unknown) => {
        console.error(
            'TalkControl: failed to load `feather-icons`. Feather icons will not be rendered.',
            cause
        );
        return undefined;
    });
}

export function featherIconPack(): MarkedTcIconsOptions {
    let feather: FeatherModule | undefined;

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
    featherModulePromise = undefined;
}

/**
 * Test-only hook to simulate a failed/failing cached load without mocking
 * the real `feather-icons` module.
 */
function setFeatherModulePromise(promise: Promise<FeatherModule>): void {
    featherModulePromise = promise;
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              resetFeatherCache,
              setFeatherModulePromise,
          }
        : undefined;
