import { VendorEntry } from './copy-vendor';

/**
 * Entries describing every third-party asset bundle vendored into
 * `dist/vendor/` (see `scripts/copy-vendor.ts` and `docs/vendor.md`).
 *
 * Icon packs migrate pack by pack (#95): Feather (PR 2), Material Symbols
 * (PR 3), then Font Awesome (PR 4). Mermaid (#92) follows.
 */
export const VENDOR_MANIFEST: VendorEntry[] = [
    {
        name: 'feather-icons',
        from: 'node_modules/feather-icons',
        to: 'icons/feather',
        // The `.map` is copied too: `feather.min.js` ends with a
        // `sourceMappingURL` comment, and a missing map makes the Vite dev
        // server (and consumers' source-map-loaders) fail on every load.
        include: ['dist/feather.min.js', 'dist/feather.min.js.map'],
        licenses: ['LICENSE'],
    },
    {
        // The CSS reference the fonts with relative `url("./*.woff2")`, so
        // keeping them side by side in the same folder keeps them resolving.
        name: 'material-symbols',
        from: 'node_modules/material-symbols',
        to: 'icons/material-symbols',
        include: ['outlined.css', 'rounded.css', 'sharp.css', '*.woff2'],
        licenses: ['LICENSE'],
    },
    {
        // Font mode only (#96): the pack declares `htmlAttribute: 'class'`, so
        // `js/all.js` (SVG replacement) is not vendored. `all.min.css`
        // references `../webfonts/*.woff2`, hence the `css/` + `webfonts/`
        // structure is kept. Only the three families the CSS actually uses
        // are copied (the .ttf fallbacks and the v4 compat font are dropped).
        name: 'font-awesome',
        from: 'node_modules/@fortawesome/fontawesome-free',
        to: 'icons/font-awesome',
        include: [
            'css/all.min.css',
            'webfonts/fa-solid-900.woff2',
            'webfonts/fa-regular-400.woff2',
            'webfonts/fa-brands-400.woff2',
        ],
        licenses: ['LICENSE.txt'],
    },
    {
        // Mermaid's own ESM build (#92): the entry file imports ~100 chunks by
        // relative URL (`./chunks/mermaid.esm.min/*.mjs`), so the layout of
        // the package's `dist/` is kept. The `.map` files and `.d.ts` are not
        // shipped (the minified build does not reference its maps, and the
        // types are not part of our public API).
        name: 'mermaid',
        from: 'node_modules/mermaid',
        to: 'mermaid',
        include: [
            'dist/mermaid.esm.min.mjs',
            'dist/chunks/mermaid.esm.min/*.mjs',
        ],
        licenses: ['LICENSE'],
    },
    // Bundled inside Mermaid's chunks: their licenses must travel with them
    // (EPL-2.0 for elkjs, MPL-2.0 OR Apache-2.0 for DOMPurify, MIT for KaTeX).
    // No file of their own is copied. The licenses of the other bundled
    // libraries are kept by Mermaid's own build as `/*! … */` banners.
    {
        name: 'elkjs',
        from: 'node_modules/elkjs',
        to: 'mermaid/licenses/elkjs',
        include: [],
        licenses: ['LICENSE.md'],
    },
    {
        name: 'dompurify',
        from: 'node_modules/dompurify',
        to: 'mermaid/licenses/dompurify',
        include: [],
        licenses: ['LICENSE'],
    },
    {
        name: 'katex',
        from: 'node_modules/katex',
        to: 'mermaid/licenses/katex',
        include: [],
        licenses: ['LICENSE'],
    },
];
