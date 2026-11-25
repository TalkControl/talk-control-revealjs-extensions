# Migrating to 2.0 (reveal.js 6)

Version 2.0 embeds and pins **reveal.js 6.0.2**. reveal.js is bundled by the library (exact version, no range), so you do not install or upgrade it yourself. Use the `Reveal` object re-exported by the library: a second copy of reveal.js in your project would not share state with the one TalkControl drives (`npm ls reveal.js` must show a single copy).

> **Why a major version?** A new reveal.js major changes the rendering and the typing of every deck, and TalkControl ships reveal.js: see [ADR 0003](./adr/0003-major-version-follows-embedded-reveal-js.md). The previous public versions were `1.0.0-rc-*` prereleases; `2.0.0` is the first stable release.

## Checklist

- [ ] Replace `PluginFunction` by `RevealPluginFactory` (see _Types_).
- [ ] Replace `Reveal.Api` / `Reveal.Options` by `RevealApi` / `RevealConfig`.
- [ ] Remove `@types/reveal.js` from your project: reveal.js 6 ships its own types.
- [ ] Remove `marked` from your dependencies if it was only there as a peer of TalkControl.
- [ ] Check the `marked` engine typing if you read `plugin.marked` (see _Markdown engine_).
- [ ] If you link to `#my-heading`, add an explicit id: headings no longer get one.
- [ ] If you override the theme with Sass, rename the variables to kebab-case.
- [ ] If you write raw `fa-*` or Material Symbols classes in HTML, declare the icon pack in `fontIcons` (see _Icons_).
- [ ] Review the visual diff of your decks (overlay, lightbox, print-pdf).

## Breaking changes at a glance

| Area             | Before (1.0.0-rc)                                   | After (2.0)                                                             |
| ---------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| reveal.js        | 5.x, peer-compatible range                          | 6.0.2 embedded, exact version                                           |
| Types            | `@types/reveal.js` (`Reveal.Api`, `PluginFunction`) | native `RevealApi`, `RevealConfig`, `RevealPluginFactory`               |
| `marked`         | peer dependency, marked 4/5 API                     | no peer; engine shipped by reveal.js (marked 17), token-based renderers |
| `plugin.marked`  | `Marked` instance                                   | `TcMarkedEngine \| null` (local type, live getter)                      |
| Heading ids      | generated (`<h2 id="my-heading">`)                  | not generated                                                           |
| Sass variables   | `$mainColor`, `$linkColor`, ...                     | `$main-color`, `$link-color`, ...                                       |
| Font Awesome     | all classes available, SVG mode                     | font mode, pack required, no SVG features, no v4/v5 aliases             |
| Material Symbols | raw classes worked without a pack                   | pack required                                                           |
| Browser targets  | Chrome 107, Firefox 104, Safari 16.0                | Chrome 111, Firefox 114, Safari 16.4 (`baseline-widely-available`)      |

## Types

reveal.js 6 ships native types and the old `@types/reveal.js` namespace (`Reveal.Api`, `Reveal.Options`, `Reveal.Plugin`, `PluginFunction`) is gone. The library now re-exports:

```ts
import type {
    RevealApi,
    RevealConfig,
    RevealPlugin,
    RevealPluginFactory,
} from '@talk-control/talk-control-revealjs-extensions';
```

`ThemeInitializerOptions['plugins']` is now `RevealPluginFactory[]`. `PluginFunction` is kept as a **deprecated alias** of `RevealPluginFactory` and will be removed in a later major version.

## Markdown engine (`marked`)

- reveal.js 6 embeds **marked 17** (it was marked 4 with reveal.js 5). TalkControl no longer lists `marked` as a peer dependency: the extensions run on the engine shipped with reveal.js.
- `Reveal.getPlugin('talk-control-markdown').marked` is typed with a **local, minimal type** (`TcMarkedEngine`: `use` and `parse`), and may be `null` before the plugin is initialized. It is a live getter: it always returns the current engine.
- Rendering differences inherited from marked 17 (no TalkControl change):
    - automatic `id` attributes on headings are no longer generated (marked removed `headerIds`); if you linked to `#my-heading`, add an explicit id;
    - blank lines between blocks are kept in the generated HTML (harmless for rendering);
    - an indented code block now gets `class=""` instead of `class="undefined"`.
- Custom `marked` extensions you register yourself must use the marked 17 API (renderers receive token objects, for example `image({ href, title, text })`).

## Imports

reveal.js 6 only exposes the entries of its `exports` map. TalkControl already uses them; if your own code imports reveal.js plugins, update the paths:

| reveal.js 5                                | reveal.js 6                  |
| ------------------------------------------ | ---------------------------- |
| `reveal.js/plugin/markdown/markdown.esm`   | `reveal.js/plugin/markdown`  |
| `reveal.js/plugin/highlight/highlight.esm` | `reveal.js/plugin/highlight` |
| `reveal.js/plugin/notes/notes.esm`         | `reveal.js/plugin/notes`     |
| `reveal.js/plugin/zoom/zoom.esm`           | `reveal.js/plugin/zoom`      |
| `reveal.js/dist/reveal.css`                | `reveal.js/reveal.css`       |

## Theme and Sass

reveal.js 6 declares its theme settings in kebab-case with `!default` and emits them as `:root { --r-* }` as soon as `template/settings` is loaded. TalkControl defines its values **before** importing it, so the compiled theme keeps the TalkControl look (same colors, fonts and sizes as 1.0.0-rc).

If you build your own Sass on top of reveal.js, rename the variables and keep defining them before reveal's settings:

| 1.0.0-rc (camelCase)             | 2.0 (kebab-case)                         |
| -------------------------------- | ---------------------------------------- |
| `$mainColor`                     | `$main-color`                            |
| `$linkColor` / `$linkColorHover` | `$link-color` / `$link-color-hover`      |
| `$headingFont`                   | `$heading-font`                          |
| `$backgroundColor`               | `$background-color` (plus `$background`) |

New custom properties are available (`--r-background`, `--r-link-color-dark`, overlay and lightbox variables). The compiled stylesheet is still `talk-control-revealjs-theme.css`.

## Icons

- Font Awesome and Material Symbols are lazy-loaded fonts, only fetched once their pack (`fontAwesomeIconPack()`, `materialSymbolsIconPack()`) is in `fontIcons`. Raw `fa-*` or Material Symbols classes written in HTML **without** the pack used to work as a side effect of the library embedding them for everyone: declare the pack.
- Font Awesome runs in font mode only: SVG-only features (`data-fa-transform`, `data-fa-mask`, layers, `svg-inline--fa` styling) and the v4/v5 compatibility aliases are gone.
- See [icons](./icons.md) for the details.

## Browser support

The build target is `baseline-widely-available`: Chrome and Edge 111, Firefox 114, Safari 16.4 (previously 107, 104 and 16.0).

## Other changes

- The theme CSS still declares `@charset "UTF-8"` and the file name `talk-control-revealjs-theme.css` is unchanged.

- The lightbox/overlay buttons, the media play button and the touch (`pointer: coarse`) sizes come from reveal.js 6.
- Full-page mode uses `100dvh`, and `show-notes` uses viewport units, as upstream.
