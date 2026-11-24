# Attributes (`data-tc-*`)

`data-tc-*` HTML attributes let you override a Talk-Control `--tc-*` custom
property **on a single element**, directly in your Markdown or HTML, without
writing an inline `style`.

```markdown
A red heart: ![](heart 'tc-icons fa')<!-- .element: data-tc-icon-color="red" -->
```

This reads the same as overriding `--tc-icon-color` in CSS, but scoped to
just that one icon instead of every icon in a section.

## Naming convention

Every attribute follows a strict 1:1 naming convention: `data-tc-X` feeds the
`--tc-X` custom property of the same name, nothing more. This convention is
generic: it applies to any `--tc-X` custom property the SCSS theme reads via
typed `attr()` (see the equivalence table below for the attributes currently
read somewhere in the theme), not to a hand-maintained, closed list - the
`tc-attr-polyfill` fallback addon (below) derives the mapping from the
attribute name itself, by this same convention, rather than from a table of
known names.

What makes an attribute have a visible effect is whether some SCSS rule
reads it via `attr(data-tc-X type(…), var(--tc-X))` - the table below lists
every one that currently does. Writing a `data-tc-X` attribute no SCSS rule
reads is harmless, just invisible.

## Equivalence table

| Attribute                                | Custom property                       | Component                                                                                                |
| ---------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `data-tc-icon-color`                     | `--tc-icon-color`                     | Icons (Material, Feather, Font Awesome) - see [Icons](./icons.md)                                        |
| `data-tc-icon-size`                      | `--tc-icon-size`                      | Icons (Material, Feather, Font Awesome) - see [Icons](./icons.md)                                        |
| `data-tc-admonition-bg-color`            | `--tc-admonition-bg-color`            | `custom` admonitions - see [Admonitions](./admonition.md)                                                |
| `data-tc-transition-color`               | `--tc-transition-color`               | Transition slides (title/underline color) - see [Specifics slides](./specifics-slides.md)                |
| `data-tc-transition-title-font-size`     | `--tc-transition-title-font-size`     | Transition slides (title font size) - see [Specifics slides](./specifics-slides.md)                      |
| `data-tc-transition-sub-title-font-size` | `--tc-transition-sub-title-font-size` | Transition slides (subtitle font size) - see [Specifics slides](./specifics-slides.md)                   |
| `data-tc-transition-padding-h1`          | `--tc-transition-padding-h1`          | Transition slides (title padding/underline position) - see [Specifics slides](./specifics-slides.md)     |
| `data-tc-transition-margin-top`          | `--tc-transition-margin-top`          | Transition slides (title position) - see [Specifics slides](./specifics-slides.md)                       |
| `data-tc-transition-left-right-mg-top`   | `--tc-transition-left-right-mg-top`   | Transition slides, `left`/`right` class (title position) - see [Specifics slides](./specifics-slides.md) |
| `data-tc-transition-top-mg-top`          | `--tc-transition-top-mg-top`          | Transition slides, `top` class (title position) - see [Specifics slides](./specifics-slides.md)          |
| `data-tc-transition-bottom-mg-top`       | `--tc-transition-bottom-mg-top`       | Transition slides, `bottom` class (title position) - see [Specifics slides](./specifics-slides.md)       |
| `data-tc-transition-line-color`          | `--tc-transition-line-color`          | Transition slides (underline color) - see [Specifics slides](./specifics-slides.md)                      |

`--tc-transition-display-line` is the one documented transition variable
**not** in this table: it holds a bare CSS keyword (`block`/`none`), which
does not map onto a `<color>`/`<length>` typed `attr()` token like every
other variable in this group, so it has no `data-tc-*` counterpart. It stays
overridable only via a manually-authored `style="--tc-transition-display-line:…"`.

### `data-tc-transition-*` goes on the heading, not on the slide

Every `data-tc-transition-*` attribute must be written on the exact element
whose CSS rule reads it - `h1` for every transition variable except
`data-tc-transition-sub-title-font-size`, which goes on `h2`:

```markdown
<!-- .slide: class="transition" -->

# Talk Control Theme <!-- .element: data-tc-transition-color="red" data-tc-transition-line-color="blue" -->

## With a colored subtitle <!-- .element: data-tc-transition-color="seagreen" -->
```

This is **not** the same placement as the pre-existing
`style="--tc-transition-color:…"` override (see
[Specifics slides](./specifics-slides.md)), which is written on the
`<section>` via `<!-- .slide: -->` and reaches `h1`/`h2` through normal CSS
custom-property inheritance. Typed `attr()` has no equivalent: it only ever
reads an attribute off the element it is declared on, never off an
ancestor, so a `data-tc-transition-*` attribute written on the `<section>`
has no effect on `h1`/`h2` on a browser with native support - write it on
the heading `<!-- .element: -->` targets instead. (The `tc-attr-polyfill`
fallback would actually mirror a section-level attribute down to `h1`/`h2`
via custom-property inheritance, since it writes a real inline `--tc-*`
style - which is exactly the Safari/Chrome inconsistency this placement
rule avoids: always write it on the heading, and both paths agree.)

For a `custom` admonition created with the `!!! custom … tc-admonition-color="…"`
Markdown syntax, the parser emits `data-tc-admonition-bg-color` for you - you
never need to write that attribute by hand in that case. You do need it
yourself when authoring a `custom` admonition directly in HTML, or via
reveal.js' `<!-- .element: -->` comment syntax (see
[Admonitions - Use comment syntax](./admonition.md#use-comment-syntax)).

## Which variables get a `data-tc-*` attribute?

Not every `--tc-*` custom property does, and that is deliberate. A variable
is eligible only if **all** of these hold:

1. Its value fits a typed `attr()` token (`<color>`, `<length>`, a number, a
   `<custom-ident>`...). Grid templates (`grid-template-columns`...), composed
   values and bare keywords do not.
2. It is read by the element that carries the attribute itself, because
   `attr()` never reads an ancestor's attribute (see the placement rule
   above). A variable that descendants read through inheritance, such as
   `--tc-speaker-width-img`, the heading/link colors of a multiple-columns
   slide (`--tc-multiple-col-heading-color`, `--tc-multiple-col-link-color`)
   or the speaker grid, stays an inline `style="--tc-*:…"` set once on the
   slide or the container.
3. Someone actually needs to override it per element, in a way a class or the
   inline `style` does not already cover.

The groups discussed in #137 do not meet them today: the QR code and the
backgrounds expose no `--tc-*` variable at all (they are configured through
classes and options), the multiple-columns and speaker variables are mostly
read by descendants or composed into grids. `--tc-speaker-img-pos` (read on
the `<img>` itself) would qualify the day an author asks for it; it is a
one-line addition, so it is not added speculatively. Each `data-tc-*` we
document becomes a public promise, which is why the table above grows one
justified variable at a time.

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

- It mirrors **any** `data-tc-*` attribute onto its matching inline
  `--tc-*` custom property, deriving the property name from the attribute
  name by the same 1:1 convention the CSS relies on (strip the `data-`
  prefix) - not from a hand-maintained table. This applies on the current
  slides and any element added or changed afterwards (via a
  `MutationObserver` watching all attribute mutations, filtered by the
  `data-tc-` prefix in the handler).
- It does nothing at all - no scan, no observer - on a browser that
  already supports typed `attr()` natively, detected once via
  `CSS.supports`.
- A `data-tc-*` attribute with no matching SCSS rule is mirrored to a
  `--tc-*` custom property nobody reads: harmless, just invisible, exactly
  like on a browser with native support.

**Limits**: it re-implements, in JavaScript, behavior the CSS engine will
eventually provide natively everywhere. A guard test
(`src/scss/theme/attr-mapping.guard.spec.ts`) checks that every `data-tc-*`
attribute actually read via `attr()` somewhere in the SCSS theme is
documented in the equivalence table above - not that the polyfill "knows"
about it, since it no longer needs to.

**Removal**: this polyfill is temporary by design, and will be removed as
soon as Safari stable supports typed `attr()` - tracked in
[#93](https://github.com/TalkControl/talk-control-revealjs-extensions/issues/93),
which also owns the decision on how that moment is monitored. Removing it is
a two-file, two-line change: delete `tc-attr-polyfill.ts`/`.spec.ts`, and
drop its import and call in `src/theme-plugin.ts`.
