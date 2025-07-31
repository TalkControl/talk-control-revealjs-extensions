# Helpers

Talk-Control provides a set of CSS helper classes to easily control the layout, sizing, and behavior of elements within your slides. These can be applied to images, text blocks, and other elements using Markdown attributes.

## Layout Helpers

These classes help you position elements on your slide.

| Class          | Description                                                                              |
| -------------- | ---------------------------------------------------------------------------------------- |
| `.center`      | Centers an element horizontally.                                                         |
| `.float-left`  | Floats an element to the left, allowing text to wrap around its right.                   |
| `.float-right` | Floats an element to the right, allowing text to wrap around its left.                   |
| `.full-center` | Centers a block both horizontally and vertically. Ideal for a single element on a slide. |
| `.flex-row`    | Arranges direct child elements in a row with space around them.                          |

### Examples

**Center horizontally an image:**

```markdown
![](./assets/images/300x300.png 'center')
```

![](./imgs/helper-image-center.png)

**Center horizontally and vertically an image:**

```markdown
![](./assets/images/300x300.png 'full-center')
```

![](./imgs/helper-image-full-center.png)

**Float an image to the left of some text:**

```markdown
![](./assets/images/gde.png 'float-left')

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec risus leo. Vestibulum condimentum orci in urna auctor aliquet. Quisque mi erat, placerat non porttitor ut, gravida eu erat. Fusce semper ipsum vel nibh porttitor aliquam. Cras sed porttitor est, id scelerisque odio. Pellentesque sit amet imperdiet ex. Aliquam erat.
```

![](./imgs/helper-image-float-left.png)

**Use flex-row positionning:**

```md
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

or

```md
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

![](./imgs/helper-flex-row.png)

## Sizing Helpers

Control the dimensions and margins of your elements.

| Class          | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| `.full-width`  | Makes an element span the full width of its container.                    |
| `.full-height` | Makes an element span the full height of its container.                   |
| `.w-[size]`    | Sets a fixed width. `[size]` is a value from 50 to 1000 in steps of 50.   |
| `.h-[size]`    | Sets a fixed height. `[size]` is a value from 50 to 1000 in steps of 50.  |
| `.wm-[size]`   | Sets a `max-width`. `[size]` is a value from 50 to 1000 in steps of 50.   |
| `.hm-[size]`   | Sets a `max-height`. `[size]` is a value from 50 to 1000 in steps of 50.  |
| `.mt-[size]`   | Sets `margin-top`. `[size]` is a value from 10 to 1000 in steps of 10.    |
| `.mb-[size]`   | Sets `margin-bottom`. `[size]` is a value from 10 to 1000 in steps of 10. |

### Example

**An image with a fixed width and a fixed height:**

```markdown
Image (w-500) :

![](./assets/images/350x90.png 'w-500')

Div background:

<div style="background:red;" class="w-500 h-200"> w-500 h-200</div>
```

![](./imgs/helper-image-size.png)

**An image with a max fixed width and a max fixed height:**

```markdown
Image :

![](./assets/images/350x90.png 'wm-500')

Div background:

<div style="background:red; width:600px;" class="wm-500 h-200"> (height:600px) wm-500 h-200</div>
```

![](./imgs/helper-image-max-size.png)

**Play with top and bottom margins:**

```md
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

![](./imgs/helper-margins.png)

**Force image to take all the width:**

```md
![](./assets/images/1000x200.png 'full-width')
```

![](./imgs/helper-image-full-width.png)

**Force image to take all the height:**

```md
<div style="height:600px; width:100%; border: dashed 3px grey;">
    <img class="full-height center" src="./assets/images/500x500.png">
</div>
```

![](./imgs/helper-image-full-height.png)

## List Fragments

To make every item in a list appear one by one (as fragments), you don't need to add `.fragment` to every `<li>`. Instead, just add the `.list-fragment` class to the end of list items. Talk-Control will automatically apply the `.fragment` class to all `<li>` elements in that list.

### Example

```markdown
-   First item
-   Second item
-   **Third item**
-   Fourth item
<!-- .element: class="list-fragment" -->
```

This works for both ordered (`<ol>`) and unordered (`<ul>`) lists.

## Apply Custom style to your image

Due to the syntax of image `![alt](path-to-img)`, if you want to add a class to your image, you have to use this syntax:

```md
![](./assets/images/gde.png)<!-- .element: class="custom-img-style" -->
```

this will add class 'custom-img-style' to the image.

Now, we integrate in TalkControl the possibility to directly add classes attributes in image declaration

```md
![](./assets/images/gde.png 'custom-img-style')
```

To use this syntax, you have to indicate to ThemeInitialiazer method the class you integrate to help the engine to analyse it:

```javascript
tcMarkedOptions: {
    //...
    knowStyles: ['custom-img-style'],
},
```

If you don't add this, it won't work with the new custom syntax
