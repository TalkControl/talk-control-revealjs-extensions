# Different Layout

For the moment, you have the possibility to have multiple columns for displaying informations.

## Multiple column layout

Due to some "magic" done by RevealJS engine, it's recommended to not use multiple columns with vertical slides.

Multiple columns with background and vertical slides won't work.

Also, only colors and image background are allowed in multiple columns !

A new syntax has to be used

```md
<!-- .slide: class="tc-multiple-columns" -->

##++##

# Column 1

Some content

##++##

##++##

# Column 2

Some content

##++##

##++##

# Column 3

Some content

##++##
```

![](./imgs/multiple-cols.png)

### Multiple column layout (with background)

```md
<!-- .slide: class="tc-multiple-columns" -->

##++## data-background="red"

# Column 1 with bg

Some content

##++##

##++## data-background="./assets/images/light_background.jpg" class="mask"

# Column 2 with image bg

Some content

##++##
```

![](./imgs/multiple-cols-bg.png)

### Multiple column layout (with inverted contrast)

```md
<!-- .slide: class="tc-multiple-columns" -->

##++## data-background="red"

# Column 1 with bg

Some content

##++##

##++## data-background="./assets/images/light_background.jpg" class="mask inverted-contrast"

# Column 2 with image bg

Some content

##++##
```

![](./imgs/multiple-cols-invert.png)

Each column is a div, but you can use helpers class in it.
