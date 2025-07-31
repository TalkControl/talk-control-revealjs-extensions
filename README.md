# Talk-Control-RevealJS-Extensions

<p align="center">
    <a href="https://github.com/TalkControl/talk-control-revealjs-extensions" target="_blank"><img src="https://raw.githubusercontent.com/TalkControl/talk-control-revealjs-extensions/c81a3bb79852b61382e2a97444f5088d6102b3ec/public/talk-control.png" width="200" alt="TalkControl Logo"></a>
</p>

<p align="center">
    <a href="https://github.com/TalkControl/talk-control-revealjs-extensions/actions"><img src="https://github.com/TalkControl/talk-control-revealjs-extensions/actions/workflows/main.yml/badge.svg" alt="Build Status"></a>
    <a href="https://www.npmjs.com/package/talk-control-revealjs-extensions"><img src="https://img.shields.io/npm/v/talk-control-revealjs-extensions.svg" alt="NPM version"></a>
    <a href="https://github.com/TalkControl/talk-control-revealjs-extensions/blob/main/LICENSE"><img src="https://img.shields.io/github/license/TalkControl/talk-control-revealjs-extensions" alt="License"></a>
</p>

## About TalkControl

TalkControl aims to provides an easy to use extensions for anyone wanted to create slides with [reveal.js](https://github.com/hakimel/reveal.js).

You can preview it here : https://talk-control-revealjs-extensions.netlify.app/

## Features

Talk Control adds numerous out-of-the-box features:

### Core Extensions

-   **Config UI** : An interface accessible with the `C` key to change themes, presentation types, and languages on the fly.
-   **Theming** : Applies and manages your presentation's themes.
-   **Internationalization (i18n)** : Multi-language support for your slides.
-   **Templates** : Propose diferent templates usable : transitions, speakers, ...
-   **Helpers** : Severals helpers likes positions, margins, backgrounds, ...
-   **Multiple Columns** : Create complex layouts with multiple columns.
-   **Copy to Clipboard** : Adds the ability to copy the content of code blocks.

### Markdown Extensions

-   **Admonitions**: Stylized information blocks (note, warning, etc.).
-   **Icons**: Easily integrate icons (Feather Icons, Font Awesome, etc.).
-   **QR Codes**: Generate QR Codes directly in your slides.
-   **Backgrounds via Markdown**: Change a slide's background directly from your Markdown file.
-   **Columns via Markdown**: Define column layouts with a simple syntax.

## How to

See [How to](./docs/how-to.md)

## Development

To contribute to the project, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/TalkControl/talk-control-revealjs-extensions.git
    cd talk-control-revealjs-extensions
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the development server:**

    ```bash
    npm run start
    ```

    This will start a server with the demo presentation.

4.  **Build for production:**

    ```bash
    npm run build
    ```

5.  **Run tests:**
    ```bash
    npm run test
    ```

## License

This project is licensed under the [Apache 2](LICENSE) License.
