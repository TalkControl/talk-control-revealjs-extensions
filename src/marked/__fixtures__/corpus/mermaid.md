# Mermaid diagrams

```mermaid
flowchart LR
  A["Markdown"] --> B["Slide"]
```

```mermaid h-400 center fragment
sequenceDiagram
  Alice->>Bob: Hello
```

```mermaid h-300 class="big" id="flow" style="width: 50%" aria-label='Flow "A to B"' onclick="alert(1)"
flowchart LR
  A --> B
```

~~~mermaid fade-up
stateDiagram-v2
  [*] --> Still
~~~

Text between two diagrams.

```mermaid
flowchart LR
  A["<b>x</b> & y"] --> B
```
<!-- .element: class="fragment" -->

```mermaidjs
not a diagram
```

!!! note
a diagram after an admonition
!!!

```mermaid
pie title Pets
  "Dogs" : 386
```
