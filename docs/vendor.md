# Vendored assets (`dist/vendor/`)

Some features (icon packs, Mermaid diagrams — see issues #95 and #92) need
third-party fonts, CSS or scripts that are too heavy to embed in the main
bundle. Instead, TalkControl ships them as plain files under `dist/vendor/`
and loads them by URL, on demand, only when a feature that needs them is
actually configured.

This page documents the mechanism itself. It does not yet change what gets
loaded: as of this version, `dist/vendor/` ships empty — no icon pack has
moved to it yet (see issue #95, PR 2 to 4).

## The `dist/vendor/` folder

`dist/vendor/` is populated at build time by `scripts/copy-vendor.ts`, from
the manifest in `scripts/vendor-manifest.ts`. It must be deployed **next to**
the library's own file (`dist/talk-control-revealjs-extensions.js` or
`dist/talk-control-revealjs-extensions.umd.cjs`), unless you set
`vendorBaseUrl` (see below).

If you simply copy the whole `dist/` folder to your host (the common case for
a reveal.js presentation served as static files), `dist/vendor/` comes along
automatically and nothing else is needed.

## `vendorBaseUrl`

Pass `vendorBaseUrl` to `ThemeInitializer.init` to tell TalkControl where to
find the vendor folder, if it isn't served right next to the library file:

```javascript
ThemeInitializer.init({
    // ... other options
    vendorBaseUrl: '/assets/talk-control/vendor/',
});
```

`vendorBaseUrl` accepts:

-   an absolute URL (`https://cdn.example.com/talk-control/vendor/`),
-   a root-relative path (`/assets/talk-control/vendor/`),
-   a path relative to the page (`vendor/`), resolved against
    `document.baseURI`.

When omitted, it defaults to a `vendor/` folder next to the library's own
module (`new URL('./vendor/', import.meta.url)`) — which is exactly where
`dist/vendor/` already sits, so the default works out of the box whenever
`dist/` is deployed as a whole.

## Recipe: a consumer with a bundler

If your presentation goes through a bundler (Vite, webpack…) instead of
being served from `node_modules` directly, `dist/vendor/` needs to be copied
into your own public/output folder explicitly — bundlers don't know to pick
up files that nothing in your code `import`s. For example, with Vite:

```javascript
// vite.config.js
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default {
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/@talk-control/talk-control-revealjs-extensions/dist/vendor',
                    dest: 'talk-control',
                },
            ],
        }),
    ],
};
```

Then point `vendorBaseUrl` at wherever that ends up being served:

```javascript
ThemeInitializer.init({
    vendorBaseUrl: '/talk-control/vendor/',
});
```

The same idea applies to webpack's `CopyWebpackPlugin`, or simply a `cp -r`
in your build script if you don't use a bundler-level copy plugin.

## The UMD build

The UMD build (`dist/talk-control-revealjs-extensions.umd.cjs`, used via
`require()` or a classic `<script>` tag) resolves its default vendor folder
differently depending on how it's loaded:

-   **Loaded as a plain `<script src="…umd.cjs">` tag**: it uses that
    script's own URL (via `document.currentScript`) to find `vendor/` next to
    it. This is the common case and needs no configuration.
-   **Loaded through `require()` in Node, or by a bundler, or injected
    dynamically into the page after it has already finished running**:
    `document.currentScript` isn't available (it's only set while a
    `<script>` is synchronously executing). The default silently falls back
    to resolving `vendor/` against the page's own base URL, which is almost
    certainly **not** where the files actually are.

**In short: if you consume the UMD build through anything other than a
top-level `<script src>` tag, always set `vendorBaseUrl` explicitly.** The
ESM build doesn't have this caveat — `import.meta.url` always points at the
module's own location.

## Errors

A failed load (missing file, wrong `vendorBaseUrl`, blocked by a CSP…) never
breaks the presentation: it's logged to the console and the slides still
render, just without that particular asset. If you see
`Cannot load \`…\`. The \`vendor/\` folder of TalkControl must be served next
to the library script, or set \`vendorBaseUrl\` in \`ThemeInitializer.init\`.`
in your console, that's this mechanism telling you exactly that.
