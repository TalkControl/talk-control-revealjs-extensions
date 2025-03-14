<!-- .slide: class="transition" -->

# Select data type

## Slides hidden according to configuration

##==##

# Display some slides according asked configuration

Based on url parameter `?data-type=xxx` where `xxx` is the configuration asked. You could also use `data-type=xxx` html element corresponding to this selector `.slides`.

-   Default value is `on-stage`
-   You can specify multiple values separated by space (to match multiple configuration)
-   You can give the name you want
-   To test it, play wih the url parameter `?data-type=xxx`

##==##

<!-- .slide: data-type-show="on-stage" class="with-code" -->

# Slide on stage only

-   Here data-type is `on-stage`

##--##

<!-- .slide: class="with-code" data-type-show="on-stage" -->

```md
<!-- .slide: data-type-show="on-stage" -->

# Slide on stage only

-   Here data-type is `on-stage`
```

##==##

<!-- .slide: data-type-show="restitution" -->

# Slide on restitution only

-   Here data-type is `restitution`

##--##

<!-- .slide: class="with-code" data-type-show="restitution" -->

```md
<!-- .slide: data-type-show="restitution" -->

# Slide on restitution only

-   Here data-type is `restitution`
```

##==##

<!-- .slide: data-type-show="on-stage other-state" -->

# Slide on stage only and other state

-   Here data-type could be `on-stage` or `other-state`

##--##

<!-- .slide: class="with-code"  data-type-show="on-stage other-state"-->

```md
<!-- .slide: data-type-show="on-stage other-state" -->

# Slide on stage only and other state

-   Here data-type could be `on-stage` or `other-state`
```
