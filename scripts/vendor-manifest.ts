import { VendorEntry } from './copy-vendor';

/**
 * Entries describing every third-party asset bundle vendored into
 * `dist/vendor/` (see `scripts/copy-vendor.ts` and `docs/vendor.md`).
 *
 * Kept empty in this PR (#95 PR 1: the loader + copy mechanism only). No
 * icon pack migrates yet — that happens pack by pack in #95 PR 2
 * (Feather), PR 3 (Material Symbols) and PR 4 (Font Awesome). #92 (Mermaid)
 * adds its own entry when it lands.
 */
export const VENDOR_MANIFEST: VendorEntry[] = [];
