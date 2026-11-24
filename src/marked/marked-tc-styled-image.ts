/**
 * Styled images: known CSS classes found in the image title become the
 * `class` attribute, the rest of the title stays in `title`.
 *
 * Adapted from @anthonypena/marked-styled-image (MIT, Anthony Pena).
 * Same output as the original, with no extra escaping. Supports both renderer
 * signatures: `image(href, title, text)` (marked <= 12) and
 * `image({ href, title, text })` (marked >= 13).
 */
import type { marked } from 'marked';

export interface MarkedTcStyledImageOptions {
    knownStyles: string[];
}

interface ImageToken {
    href: string;
    title?: string | null;
    text: string;
}

const attr = (name: string, list: string[]): string =>
    list.length > 0 ? ` ${name}="${list.join(' ')}"` : '';

export function markedTcStyledImage({
    knownStyles,
}: MarkedTcStyledImageOptions): marked.MarkedExtension {
    return {
        renderer: {
            image(
                this: unknown,
                hrefOrToken: string | ImageToken,
                titleArg?: string | null,
                textArg?: string
            ): string {
                const { href, title, text } =
                    typeof hrefOrToken === 'object'
                        ? hrefOrToken
                        : { href: hrefOrToken, title: titleArg, text: textArg };
                if (!title) {
                    return `<img src="${href}" alt="${text}"/>`;
                }
                const parts = title.split(' ');
                const styles = parts.filter((s) => knownStyles.includes(s));
                const cleanTitle = parts.filter((s) => !styles.includes(s));
                return `<img src="${href}" alt="${text}"${attr('title', cleanTitle)}${attr('class', styles)}/>`;
            },
        } as marked.RendererObject,
    };
}
