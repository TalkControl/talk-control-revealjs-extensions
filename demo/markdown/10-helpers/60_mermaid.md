<!-- .slide: class="transition" -->

# Mermaid diagrams

##==##

# Draw a diagram from a code block

A fenced block whose language is `mermaid` becomes an SVG, drawn in the browser. It fills the slide by default. Nothing is downloaded when a deck has no diagram.

```mermaid center
flowchart LR
  A["Markdown"] --> B["marked"] --> C["tc-mermaid"] --> D["SVG"]
```

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

##==##

# Zoom in or out

`zoom-50` to `zoom-300` scale the diagram (here `zoom-150`).

```mermaid h-400 zoom-150 center
stateDiagram-v2
  [*] --> Light
  Light --> Dark: data-theme
  Dark --> Light: data-theme
```

##==##

# Animate it like any other element

Fragment words (`fragment`, then `fade-up`…) go on the figure, so reveal.js animates the whole diagram.

```mermaid h-400 center fragment fade-up
flowchart TD
  A["Question"] --> B{"Clear?"}
  B -- yes --> C["Next slide"]
  B -- no --> A
```
