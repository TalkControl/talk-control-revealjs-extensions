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
];
