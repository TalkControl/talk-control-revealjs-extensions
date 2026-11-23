import { VendorEntry } from './copy-vendor';

/**
 * Entries describing every third-party asset bundle vendored into
 * `dist/vendor/` (see `scripts/copy-vendor.ts` and `docs/vendor.md`).
 *
 * Icon packs migrate pack by pack (#95): Feather (PR 2, this entry), then
 * Material Symbols (PR 3) and Font Awesome (PR 4). #92 (Mermaid) adds its
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
];
