# Backgrounds helpers

In addition to the "revealJS way" to set a background for a slide (`<!-- .slide: data-background="...." -->`), you can use a new syntax:

```md
![](./assets/images/light_background.jpg 'tc-bg')
```

![](./imgs/background-new.png)

You can also use colors (color name, rgb, hash)

```md
![](red 'tc-bg')
```

![](./imgs/background-new-color.png)

This will preserve classes put on the slide element:

```md
<!-- .slide: class="mask transition" -->

# Use background but preserve meta of reveal (.slide)

![](./assets/images/dark_background.jpeg 'tc-bg')
```

![](./imgs/background-new-preserve.png)
