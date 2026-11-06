<!-- .slide: class="with-code" -->

# Code with line highlights

```javascript [1-3|5]
const a = 1;
const b = '<b>';
const c = "&lt;escaped&gt;";
// comment with 'single' and "double" quotes
if (a < 2 && b > c) {
    console.log(`template ${a}`);
}
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="with-code-dark" -->

# Code with an offset and no language

```[25: 1,4-8]
line 25
line 26
```

```
plain code block with <html> & entities &amp;
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout android:orientation="vertical">
    <TextView android:text="@string/hello" />
</LinearLayout>
```

##==##

# Inline code and indented code

Inline `<div class="x">` and `&amp;` code.

    indented code block
    with two lines
