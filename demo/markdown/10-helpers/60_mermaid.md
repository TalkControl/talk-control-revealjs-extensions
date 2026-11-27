<!-- .slide: class="transition" -->

# Mermaid diagrams

##==##

# Draw a diagram from a code block

A fenced block whose language is `mermaid` becomes an SVG, drawn in the browser. It fills the slide by default. Nothing is downloaded when a deck has no diagram.

```mermaid center
flowchart LR
  A["Markdown"] --> B["marked"] --> C["tc-mermaid"] --> D["SVG"]
```

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

````markdown
# Draw a diagram from a code block

A fenced block whose language is `mermaid` becomes an SVG.

```mermaid center
flowchart LR
  A["Markdown"] --> B["marked"] --> C["tc-mermaid"] --> D["SVG"]
```
````

Every word after `mermaid` is a CSS class of the diagram (`center` here). The full reference is `docs/mermaid.md`.

##==##

# Choose its size

An `h-*` class sets the height of the diagram, the SVG fits inside.

```mermaid h-400 center
sequenceDiagram
  participant Speaker
  participant Deck
  Speaker->>Deck: next
  Deck-->>Speaker: diagram
```

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

````markdown
# Choose its size

An `h-*` class sets the height of the diagram, the SVG fits inside.

```mermaid h-400 center
sequenceDiagram
  participant Speaker
  participant Deck
  Speaker->>Deck: next
  Deck-->>Speaker: diagram
```
````

Without `h-*`, the diagram fills the slide minus the room of the title (`--tc-mermaid-reserved-height`).

##==##

# Zoom in or out

`zoom-50` to `zoom-300` scale the diagram (here `zoom-150`).

```mermaid h-400 zoom-150 center
stateDiagram-v2
  [*] --> Light
  Light --> Dark: data-theme
  Dark --> Light: data-theme
```

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

````markdown
# Zoom in or out

`zoom-50` to `zoom-300` scale the diagram (here `zoom-150`).

```mermaid h-400 zoom-150 center
stateDiagram-v2
  [*] --> Light
  Light --> Dark: data-theme
  Dark --> Light: data-theme
```
````

Steps of 25. For another value: `<!-- .element: style="--tc-mermaid-zoom: 1.4" -->`.

##==##

# Animate it like any other element

Fragment words (`fragment`, then `fade-up`…) go on the figure, so reveal.js animates the whole diagram.

```mermaid h-400 center fragment fade-up
flowchart TD
  A["Question"] --> B{"Clear?"}
  B -- yes --> C["Next slide"]
  B -- no --> A
```

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

````markdown
# Animate it like any other element

```mermaid h-400 center fragment fade-up
flowchart TD
  A["Question"] --> B{"Clear?"}
  B -- yes --> C["Next slide"]
  B -- no --> A
```
````

`fragment` makes the block a fragment, the other words choose how it appears.

##--##

<!-- .slide: class="with-code" -->

# Anything else: `.element`

````markdown
```mermaid h-400
flowchart LR
  A --> B
```

<!-- .element: id="pipeline" data-step="2" aria-label="Build pipeline" -->
````

An `id`, a `data-*`, a `style`, an `aria-label`… go on the figure with reveal.js `<!-- .element: … -->`, right after the block.
