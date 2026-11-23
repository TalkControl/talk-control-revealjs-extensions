import { VendorEntry } from './copy-vendor';

/**
 * Entries describing every third-party asset bundle vendored into
 * `dist/vendor/` (see `scripts/copy-vendor.ts` and `docs/vendor.md`).
 *
 * Icon packs migrate pack by pack (#95): Feather (PR 2), Material Symbols
 * (PR 3), then Font Awesome (PR 4). #92 (Mermaid) adds its
 * own entry when it lands.
 */
export const VENDOR_MANIFEST: VendorEntry[] = [
    {
        name: 'feather-icons',
        from: 'node_modules/feather-icons',
        to: 'icons/feather',
        include: ['dist/feather.min.js'],
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
];
