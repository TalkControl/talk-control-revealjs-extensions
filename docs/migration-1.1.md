# Migrating to 1.1 (reveal.js 6)

Version 1.1 embeds and pins **reveal.js 6.0.2**. reveal.js is bundled by the library (exact version, no range), so you do not install or upgrade it yourself. Use the `Reveal` object re-exported by the library: a second copy of reveal.js in your project would not share state with the one TalkControl drives (`npm ls reveal.js` must show a single copy).

## Checklist

- [ ] Replace `PluginFunction` by `RevealPluginFactory` (see below).
- [ ] Replace `Reveal.Api` / `Reveal.Options` by `RevealApi` / `RevealConfig`.
- [ ] Remove `@types/reveal.js` from your project: reveal.js 6 ships its own types.
- [ ] Check the `marked` engine typing if you read `plugin.marked`.
- [ ] If you override the theme with Sass, rename the variables to kebab-case.
- [ ] Review the visual diff of your decks (heading ids, loose lists, overlay and lightbox).

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
    - loose lists are rendered with `<p>` inside `<li>`;
    - an indented code block now gets `class=""` instead of `class="undefined"`.
- Custom `marked` extensions you register yourself must use the marked 17 API (renderers receive token objects).

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

reveal.js 6 declares its theme settings in kebab-case with `!default` and emits them as `:root { --r-* }` as soon as `template/settings` is loaded. TalkControl defines its values **before** importing it, so the compiled theme keeps the TalkControl look (same colors, fonts and sizes as 1.0).

If you build your own Sass on top of reveal.js, rename the variables and keep defining them before reveal's settings:

| 1.0 (camelCase)                  | 1.1 (kebab-case)                         |
| -------------------------------- | ---------------------------------------- |
| `$mainColor`                     | `$main-color`                            |
| `$linkColor` / `$linkColorHover` | `$link-color` / `$link-color-hover`      |
| `$headingFont`                   | `$heading-font`                          |
| `$backgroundColor`               | `$background-color` (plus `$background`) |

New custom properties are available (`--r-background`, `--r-link-color-dark`, overlay and lightbox variables). The compiled stylesheet is still `talk-control-revealjs-theme.css`.

## Other changes

- The lightbox/overlay buttons, the media play button and the touch (`pointer: coarse`) sizes come from reveal.js 6.
- Full-page mode uses `100dvh`, and `show-notes` uses viewport units, as upstream.
