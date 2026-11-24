# Vendored assets (`dist/vendor/`)

Some features (icon packs, Mermaid diagrams — see issues #95 and #92) need
third-party fonts, CSS or scripts that are too heavy to embed in the main
bundle. Instead, TalkControl ships them as plain files under `dist/vendor/`
and loads them by URL, on demand, only when a feature that needs them is
actually configured.

This page documents the mechanism itself. As of this version, `dist/vendor/`
contains Feather Icons (issue #95, PR 2): its UMD-only `feather.min.js` is
copied to `dist/vendor/icons/feather/dist/` and injected as a classic
`<script>` by `loadVendorScript`, only when `featherIconPack()` is configured.
It is absent from both the ESM and the UMD bundles. Material Symbols (#95,
PR 3) is vendored too: its three stylesheets and woff2 fonts are copied side by
side into `dist/vendor/icons/material-symbols/` (the CSS use relative
`url("./*.woff2")`) and loaded by `loadVendorStylesheet` when
`materialSymbolsIconPack()` is configured. Font Awesome (PR 4, #96) is
vendored in font mode only: `css/all.min.css` and the three woff2 fonts
(solid, regular, brands) are copied into `dist/vendor/icons/font-awesome/`
(`css/` + `webfonts/` layout kept, since the CSS references
`../webfonts/*.woff2`), and loaded when `fontAwesomeIconPack()` is configured.
Its `all.js` (SVG replacement) is no longer used or shipped.

## The `dist/vendor/` folder

`dist/vendor/` is populated at build time by `scripts/copy-vendor.ts`, from
the manifest in `scripts/vendor-manifest.ts`. It is always resolved next to
the library's own file (`dist/talk-control-revealjs-extensions.js`), so it
must be deployed alongside it.

If you simply copy the whole `dist/` folder to your host (the common case for
a reveal.js presentation served as static files), `dist/vendor/` comes along
automatically and nothing else is needed.

If your presentation goes through a bundler (Vite, webpack…) instead of
being served from `node_modules` directly, make sure `dist/vendor/` is
copied into your own public/output folder next to the library file — a
bundler doesn't know to pick up files that nothing in your code `import`s.

## Errors

A failed load (missing file, blocked by a CSP…) never breaks the
presentation: it's logged to the console and the slides still render, just
without that particular asset. If you see
`Cannot load \`…\`. The \`vendor/\` folder of TalkControl must be served next
to the library script.` in your console, that's this mechanism telling you
exactly that.
