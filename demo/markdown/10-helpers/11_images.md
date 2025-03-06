<!-- .slide: class="transition" -->

# Images Utilities

##==##

# Use classes with images (look at source code generated)

Here, we use `custom-img-style` in our css and apply it to following images. First img use `custom-img-style`. Second use it to but have a `<!-- .element: -->` override. Third have an alternative text. The `custom-img-style` is set at start of `ThemeInitializer.init()` in `tcMarkedOptions`

![](./assets/images/gde.png 'custom-img-style')
![](./assets/images/gde.png 'custom-img-style')<!-- .element: class="speaker" -->
![some alternative text](./assets/images/gde.png 'custom-img-style')

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](./assets/images/gde.png 'custom-img-style')
![](./assets/images/gde.png 'custom-img-style')<!-- .element: class="speaker" -->
![some alternative text](./assets/images/gde.png 'custom-img-style')
```

##==##

# Play with images sizes or divs 😉

## Image from 50px to 1000px (width and height)

Image (w-500) :

![](./assets/images/350x90.png 'w-500')

Div background:

<div style="background:red;" class="w-500 h-200"> w-500 h-200</div>

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](./assets/images/350x90.png 'w-500')

<div style="background:red;" class="w-500 h-200"> w-500 h-200</div>
```

<!-- .element: class="big-code" -->

##==##

# Play with images max-sizes or div

## Image from 50px to 1000px (max-width and max-height)

Image :

![](./assets/images/350x90.png 'wm-500')

Div background:

<div style="background:red; width:600px;" class="wm-500 h-200"> (height:600px) wm-500 h-200</div>

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](./assets/images/350x90.png 'wm-500')

<div style="background:red; width:600px;" class="wm-500 h-200"> 
    (height:600px) wm-500 h-200</div>
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="flex-row" -->

# Play with margin top or bottom

![](./assets/images/gdg-nantes.png 'h-200 mt-430')
![](./assets/images/gdg-nantes.png 'h-200 mt-150')
![](./assets/images/gdg-nantes.png 'h-200 mt-50')
![](./assets/images/gdg-nantes.png 'h-200 mt-10')
![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-200 mb-10')
![](./assets/images/gdg-nantes.png 'h-200 mb-50')
![](./assets/images/gdg-nantes.png 'h-200 mb-160')
![](./assets/images/gdg-nantes.png 'h-200 mb-430')

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: class="flex-row" -->

![](./assets/images/gdg-nantes.png 'h-200 mt-430')
![](./assets/images/gdg-nantes.png 'h-200 mt-150')
![](./assets/images/gdg-nantes.png 'h-200 mt-50')
![](./assets/images/gdg-nantes.png 'h-200 mt-10')
![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-200 mb-10')
![](./assets/images/gdg-nantes.png 'h-200 mb-50')
![](./assets/images/gdg-nantes.png 'h-200 mb-160')
![](./assets/images/gdg-nantes.png 'h-200 mb-430')
```

##==##

# Image with full width)

## First way

Size of screen (1920)

![](./assets/images/1000x200.png 'full-width')

Notes:
Use https://dummyimage.com/1000x200/000/aaa to generate the image

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](./assets/images/1000x200.png 'full-width')
```

<!-- .element: class="big-code" -->

##==##

# Image with full width

## Second way

<img class="full-width" src="./assets/images/1000x200.png">

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<img class="full-width" src="./assets/images/1000x200.png">
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: style="height:100%" -->

# Image with full height

Div with height of 600px;

<div style="height:600px; width:100%; border: dashed 3px grey;">
    <img class="full-height center" src="./assets/images/500x500.png">
</div>

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: style="height:100%" -->

<div style="height:600px; width:100%; border: dashed 3px grey;">
    <img class="full-height" src="./assets/images/500x500.png"> 
</div>
```

<!-- .element: class="big-code" -->

##==##

# Slide with center image (horizontal)

## First way

![](./assets/images/300x300.png 'center')

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](./assets/images/300x300.png 'center')
```

<!-- .element: class="big-code" -->

##==##

# Slide with center image (horizontal)

## Second way

<img class="center" src="./assets/images/300x300.png">

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<img class="center" src="./assets/images/300x300.png">
```

<!-- .element: class="big-code" -->

##==##

# Slide with center image (horizontal & vertical)

## First way

<div class="full-center">
    <img src="./assets/images/300x300.png">
</div>

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<div class="full-center">
    <img src="./assets/images/300x300.png">
</div>
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="full-center" -->

# Slide with center image (horizontal & vertical)

## Second way

![](./assets/images/300x300.png)

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: class="full-center" -->

![](./assets/images/300x300.png)
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="flex-row" -->

# Flex row alignement with auto wrap

## First way

![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-250')
![](./assets/images/gdg-nantes.png 'h-300')
![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-350')
![](./assets/images/gdg-nantes.png 'h-300')
![](./assets/images/gdg-nantes.png 'h-350')
![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-100')

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: class="flex-row" -->

![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-250')
![](./assets/images/gdg-nantes.png 'h-300')
![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-350')
![](./assets/images/gdg-nantes.png 'h-300')
![](./assets/images/gdg-nantes.png 'h-350')
![](./assets/images/gdg-nantes.png 'h-200')
![](./assets/images/gdg-nantes.png 'h-100')
```

##==##

# Flex row alignement with auto wrap

## Second way

<div class="flex-row">
<img class="h-200" src="./assets/images/gdg-nantes.png">
<img class="h-250" src="./assets/images/gdg-nantes.png">
<img class="h-300" src="./assets/images/gdg-nantes.png">
<img class="h-200" src="./assets/images/gdg-nantes.png">
<img class="h-350" src="./assets/images/gdg-nantes.png">
<img class="h-300" src="./assets/images/gdg-nantes.png">
<img class="h-350" src="./assets/images/gdg-nantes.png">
<img class="h-200" src="./assets/images/gdg-nantes.png">
<img class="h-100" src="./assets/images/gdg-nantes.png">
</div>

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<div class="flex-row">
<img class="h-200" src="./assets/images/gdg-nantes.png">
<img class="h-250" src="./assets/images/gdg-nantes.png">
<img class="h-300" src="./assets/images/gdg-nantes.png">
<img class="h-200" src="./assets/images/gdg-nantes.png">
<img class="h-350" src="./assets/images/gdg-nantes.png">
<img class="h-300" src="./assets/images/gdg-nantes.png">
<img class="h-350" src="./assets/images/gdg-nantes.png">
<img class="h-200" src="./assets/images/gdg-nantes.png">
<img class="h-100" src="./assets/images/gdg-nantes.png">
</div>
```

##==##

# Content with float-left

## First way

![](./assets/images/gde.png 'float-left')

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](./assets/images/gde.png 'float-left')

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.
```

##==##

# Content with float-left

## Second way

<img class="float-left" src="./assets/images/gde.png">

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<img class="float-left" src="./assets/images/gde.png">

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.
```

##==##

# Content with float-right

## First way

![](./assets/images/gde.png 'float-right')

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](./assets/images/gde.png 'float-right')

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.
```

##==##

# Content with float-right

## Second way

<img class="float-right" src="./assets/images/gde.png">

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<img class="float-right" src="./assets/images/gde.png">

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.
```

##==##

<!-- .slide: class="full-center" -->

# Image with source

![](./assets/images/gdg-nantes.png 'h-400')

[Source of the image](https://github.com)

<!-- .element: class="credits" -->

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
<!-- .slide: class="full-center" -->

# Image with source

![](./assets/images/gdg-nantes.png)

[Source of the image](https://github.com)

<!-- .element: class="credits" -->
```
