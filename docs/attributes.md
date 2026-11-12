# Attributes (`data-tc-*`)

A finite set of `data-tc-*` HTML attributes let you override a Talk-Control
`--tc-*` custom property **on a single element**, directly in your Markdown
or HTML, without writing an inline `style`.

```markdown
A red heart: ![](heart 'tc-icons fa')<!-- .element: data-tc-icon-color="red" -->
```

This reads the same as overriding `--tc-icon-color` in CSS, but scoped to
just that one icon instead of every icon in a section.

## Naming convention

Every attribute follows a strict 1:1 naming convention: `data-tc-X` feeds the
`--tc-X` custom property of the same name, nothing more. This is a finite,
explicit mapping - not a generic mechanism, and not extensible by deck
authors.

## Equivalence table

| Attribute                     | Custom property            | Component                                                         |
| ----------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `data-tc-icon-color`          | `--tc-icon-color`          | Icons (Material, Feather, Font Awesome) - see [Icons](./icons.md) |
| `data-tc-icon-size`           | `--tc-icon-size`           | Icons (Material, Feather, Font Awesome) - see [Icons](./icons.md) |
| `data-tc-admonition-bg-color` | `--tc-admonition-bg-color` | `custom` admonitions - see [Admonitions](./admonition.md)         |

For a `custom` admonition created with the `!!! custom … tc-admonition-color="…"`
Markdown syntax, the parser emits `data-tc-admonition-bg-color` for you - you
never need to write that attribute by hand in that case. You do need it
yourself when authoring a `custom` admonition directly in HTML, or via
reveal.js' `<!-- .element: -->` comment syntax (see
[Admonitions - Use comment syntax](./admonition.md#use-comment-syntax)).

## Priority order

From strongest to weakest, the first one present wins:

1. `data-tc-*` attribute.
2. A manually-authored `style="--tc-*:…"` inline custom property.
3. A class-based default (e.g. `.tc-small`/`.tc-big` for icon size).
4. The theme's global default (the `--tc-*` value set on `:root`).

This holds whether or not the browser supports typed `attr()` natively: on a
supporting browser the CSS itself resolves `attr(data-tc-x type(…), var(--tc-x))`,
so the attribute wins only when present, and falls through to the inline
style/class/default chain otherwise. On a non-supporting browser, the
temporary polyfill (see below) writes the attribute's value as an inline
`--tc-*` custom property, which - being inline - already outranks any class
default, and overwrites a pre-existing manually-authored inline `--tc-*` of
the same name.

## Browser support

| Browser       | Typed `attr()` support                                      |
| ------------- | ----------------------------------------------------------- |
| Chrome / Edge | 133+ (stable since February 2025)                           |
| Firefox       | 155+ (expected September 2026)                              |
| Safari        | Not yet in stable - covered by the temporary polyfill below |

Detection happens in CSS via `@supports (color: attr(data-tc-x type(<color>), inherit))`,
mirrored in JavaScript via `CSS.supports(...)` for the polyfill below.

## Fallback without a supporting browser

Each `data-tc-*` override is declared in a `@supports` block placed **after**
the plain `var(--tc-*)` rule it overrides. A browser that does not
understand typed `attr()` never evaluates that `@supports` condition as
true, so it never sees the override at all, and keeps resolving the
`var(--tc-*)` rule above it - itself still readable from a manually-authored
`style="--tc-*:…"`, a class default, or the theme's global default, exactly
as before this feature existed.

## Print (`?print-pdf`)

Printing goes through the same CSS, so a `data-tc-*` attribute (or its
polyfilled `--tc-*` fallback) renders identically in `?print-pdf` as it does
on screen - no separate print-specific handling is needed.

## The temporary polyfill (`tc-attr-polyfill`)

On a browser without native typed `attr()` support (Safari stable today),
Talk-Control activates a small, self-contained polyfill addon
(`src/addons/tc-attr-polyfill.ts`, not part of the public API) on the
`Reveal` `ready` event:

-   It mirrors every `data-tc-*` attribute in the equivalence table above
    onto its matching inline `--tc-*` custom property, on the current slides
    and any element added or changed afterwards (via a scoped
    `MutationObserver`).
-   It does nothing at all - no scan, no observer - on a browser that
    already supports typed `attr()` natively, detected once via
    `CSS.supports`.
-   It only knows the finite table above: an unrelated `data-tc-*` attribute
    is ignored.

**Limits**: it only covers the mapping table above (icon color/size,
admonition background color) - any future `data-tc-*` attribute needs its
own entry, kept in sync with the SCSS that reads it (enforced by a guard
test). It re-implements, in JavaScript, behavior the CSS engine will
eventually provide natively everywhere.

**Removal**: this polyfill is temporary by design, and will be removed as
soon as Safari stable supports typed `attr()` - tracked in
[#93](https://github.com/TalkControl/talk-control-revealjs-extensions/issues/93),
which also owns the decision on how that moment is monitored. Removing it is
a two-file, two-line change: delete `tc-attr-polyfill.ts`/`.spec.ts`, and
drop its import and call in `src/theme-plugin.ts`.
