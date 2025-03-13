<!-- .slide: class="transition" -->

# Slides using custom background if meta is present

## Use for templating slides

##==##

# Custom generic background

Useful to define a class that has specific background (when you want to play with template and themes)

You define this in the initializer : `ThemeInitializer.init`

You can override the background of classes already present in the theme (speaker-slide, transition, ...)

##==##

<!-- .slide: class="yellow-slide" -->

# Here a Yellow slide

We use a color as parameter passed in initializer

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: class="yellow-slide" -->

# Here a Yellow slide

We use a color as parameter passed in initializer
```

##==##

<!-- .slide: class="orange-slide" -->

# Here an orange slide

We use a Hash notation as parameter passed in initializer

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: class="orange-slide" -->

# Here an orange slide

We use a Hash notation as parameter passed in initializer
```

##==##

<!-- .slide: class="transition transition-wall" -->

# Compatible with transitions or any other class

## Here we set an image

source: [unsplash](https://unsplash.com/fr/photos/mur-de-briques-blanches-4Zaq5xY5M_c) by [Joe Woods](https://unsplash.com/fr/@woods)

<!-- .element: class="credits" -->

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: class="transition transition-wall" -->

# Compatible with transitions or any other class

## Here we set an image
```
