# Installation

```bash
# run
npm install talk-control-revealjs-extensions
```

# Usage

To use Talk Control, import the main class and initialize it after Reveal.js has loaded.

Here is a basic example in your `index.html`:

```html
<!doctype html>
<html>
    <head>
        <title>My Presentation</title>
        <link
            rel="stylesheet"
            href="node_modules/talk-control-revealjs-extensions/dist/index.css" />
        <!-- Mandatory to use basic theme and helpers -->
    </head>
    <body>
        <div class="reveal">
            <div class="slides">
                <!-- Your slides here -->
            </div>
        </div>

        <script type="module">
            import { ThemeInitializer } from 'talk-control-revealjs-extensions';

            await ThemeInitializer.init({
                slidesFactory: () => {
                    return [
                        { path: 'markdown/01_intro.md' },
                        { path: 'markdown/02_content.md' },
                    ];
                },
            });
        </script>
    </body>
</html>
```

## RevealJS

This theme is a target for [RevealJS](https://revealjs.com/#/) so all you can do with RevealJS is available with this theme.

You can still use RevealJS API by importing `Reveal` object in `import { Reveal } from "talk-control-revealjs-extensions";`

# Configuration

The main configuration lets you customize a lot the theme so it will propose lots of enhancements when calling `ThemeInitializer.init(options)`. All options with (\*) are mandatory

-   `slidesFactory`(\*): A function that returns an array of objects describing the Markdown files to load. The show type can be precise in parameters (see "play with show type")
-   `activeCopyClipboard`: true if we use the clipboard, default applied is true
-   `tcMarkedOptions`: An object that can contain icons configuration. Default is an empty object
-   `tcI18nOptions`: Specifies the place of markdown files (use for internationalization). Default language is 'EN'. By default, the slides should be placed in a "markdown" repository at the same level as the index.html
-   `tcCustomBackgroundOptions`: Specifies the configuration to use custom backgrounds as template.
-   `tcThemeOptions`: Defines the default theme to use (default is 'talk-control').
-   `slidesRenderer`: function that renders a Root element (in LitHTML). It takes an html element and the list of slides to render
-   `defaultSlidesType`: Defines the "show type" of slides (default is "on-stage")

According to the options passed, you can specify the desired configuration to apply

## HTML Configuration

Directly in the html

```html
<body>
    <div class="reveal">
        <div
            class="slides"
            data-type="on-stage"
            data-lang="en"
            data-theme="talk-control"></div>
    </div>
</body>
```

If you specify on the element with ".slides" class, you can set the configuration for "show type" / "i18n" / "theme"

## URL Configuration

You can also override these settings via the URL: `?data-type=on-stage&data-lang=en&data-theme=talk-control`

## UI Configuration

Press the `C` key to open the configuration interface and change these settings live.

# Theme

See [Theme configuration](./theme.md)

# I18N

See [I18N your slides](./i18n.md)

# Layouts

See [Different Layout](./layouts.md)

# Backgrounds helpers

See [Background Helpers](./backgrounds.md)

# Use icons

See [icons](./icons.md)

# Admonitions

See [admonitions](./admonition.md)

# QRCodes

See [QRCodes](./qrcode.md)

# Helpers

See [Helpers](./helpers.md)

# Conditional display

See [ShowType](./show-type.md)
