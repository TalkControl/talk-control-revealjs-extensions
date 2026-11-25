import { marked } from 'marked';

const TYPE_MERMAID_TC = 'mermaidTc';

// Opening fence: up to 3 spaces of indentation, 3+ backticks or tildes, then
// exactly the word `mermaid` (so `mermaidjs` and `` ``` mermaid `` stay code),
// then an optional info string made of the authoring options.
const openingFenceRegex =
    /^( {0,3})(`{3,}|~{3,})mermaid(?:[ \t]+([^\n]*))?(?:\n|$)/;
const startRegex = /(?:^|\n)( {0,3}(?:`{3,}|~{3,})mermaid(?:[ \t]|\n|$))/;

// Any word that is a valid CSS class name becomes a class, like the options
// of `<!-- .element: class -->` and `tc-qrcode`.
const CLASS_WORD_REGEX = /^[a-z][a-z0-9-]*$/i;

// Words that animate the figure as a reveal.js fragment. They go on the
// <figure> (the element reveal shows step by step), the rest on the diagram.
const FRAGMENT_WORD_REGEX =
    /^(?:fragment|fade-[a-z-]+|highlight-[a-z-]+|grow|shrink|strike|semi-fade-out|current-visible)$/;

interface TcMermaidToken extends marked.Tokens.Generic {
    type: 'mermaidTc';
    raw: string;
    source: string;
    info: string;
}

function isTcMermaidToken(
    token: marked.Tokens.Generic
): token is TcMermaidToken {
    return token.type === TYPE_MERMAID_TC;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Authoring options: `name="value"`, `name='value'` or a bare word.
const OPTION_REGEX = /([^\s="']+)=(?:"([^"]*)"|'([^']*)')|(\S+)/g;
const ATTRIBUTE_NAME_REGEX = /^[a-z_:][-a-z0-9_:.]*$/i;
// Event handlers never come from an authoring option, and the attributes the
// addon relies on stay under its control.
const FORBIDDEN_ATTRIBUTE_REGEX = /^(?:on|data-tc-mermaid)/i;

interface ParsedOptions {
    classes: string[];
    attributes: Map<string, string>;
}

/**
 * Splits the info string into classes (bare words and `class="…"`) and
 * attributes (`name="value"`). The first occurrence of an attribute wins.
 */
function parseOptions(info: string): ParsedOptions {
    const classes: string[] = [];
    const attributes = new Map<string, string>();
    for (const match of info.matchAll(OPTION_REGEX)) {
        const [, name, doubleQuoted, singleQuoted, word] = match;
        if (word !== undefined) {
            classes.push(word);
            continue;
        }
        const value = doubleQuoted ?? singleQuoted ?? '';
        if (name.toLowerCase() === 'class') {
            classes.push(...value.split(/\s+/));
        } else if (
            ATTRIBUTE_NAME_REGEX.test(name) &&
            !FORBIDDEN_ATTRIBUTE_REGEX.test(name) &&
            !attributes.has(name)
        ) {
            attributes.set(name, value);
        }
    }
    return {
        classes: classes.filter((word) => CLASS_WORD_REGEX.test(word)),
        attributes,
    };
}

/** Removes up to `indent` leading spaces, as CommonMark does for fenced code. */
function stripIndent(line: string, indent: number): string {
    let removed = 0;
    while (removed < indent && line[removed] === ' ') {
        removed++;
    }
    return line.slice(removed);
}

/**
 * Block extension turning a ` ```mermaid ` fence into a placeholder
 * `<figure>` that the `tc-mermaid` addon fills with the rendered SVG:
 *
 * ```html
 * <figure class="tc-mermaid fragment" data-tc-mermaid="0">
 *   <div class="tc-mermaid-diagram h-400 center"></div>
 *   <pre class="tc-mermaid-source">…escaped source…</pre>
 * </figure>
 * ```
 *
 * It is a block *tokenizer*, not a `code` renderer override: the markdown
 * plugin of reveal.js owns the `code` renderer (line numbers), and its
 * signature differs between marked versions. A tokenizer runs before the
 * native `fences` one, on any engine.
 *
 * The info string carries the authoring options: bare words and `class="…"`
 * are classes, `name="value"` are attributes, all on the diagram `div` except
 * the fragment words, which go on the `<figure>`. Use reveal's
 * `<!-- .element: … -->` after the block to customize the `<figure>` itself.
 *
 * The utility classes sit on a `div` alone in its parent: `.h-400 + *` rules
 * of the theme would otherwise also size the next sibling.
 */
export function markedTcMermaid(): marked.MarkedExtension {
    // Unique in the deck: reveal parses each slide with the same engine.
    let counter = 0;

    return {
        extensions: [
            {
                name: TYPE_MERMAID_TC,
                level: 'block',
                start(src: string): number | undefined {
                    const match = startRegex.exec(src);
                    if (!match) {
                        return undefined;
                    }
                    return match.index + match[0].length - match[1].length;
                },
                tokenizer(src: string): TcMermaidToken | undefined {
                    const opening = openingFenceRegex.exec(src);
                    if (!opening) {
                        return undefined;
                    }
                    const [openingText, indentText, fence, info = ''] = opening;
                    // CommonMark: the info string of a backtick fence cannot
                    // contain a backtick.
                    if (fence[0] === '`' && info.includes('`')) {
                        return undefined;
                    }

                    // Closing fence: same character, at least as long, up to
                    // 3 spaces of indentation, nothing else on the line.
                    const closingRegex = new RegExp(
                        `^ {0,3}\\${fence[0]}{${fence.length},}[ \\t]*$`
                    );
                    const lines: string[] = [];
                    let position = openingText.length;
                    while (position < src.length) {
                        const newline = src.indexOf('\n', position);
                        const lineEnd = newline === -1 ? src.length : newline;
                        const line = src.slice(position, lineEnd);
                        position = newline === -1 ? src.length : newline + 1;
                        if (closingRegex.test(line)) {
                            break;
                        }
                        lines.push(stripIndent(line, indentText.length));
                    }

                    return {
                        type: TYPE_MERMAID_TC,
                        raw: src.slice(0, position),
                        source: lines.join('\n'),
                        info,
                    };
                },
                renderer(token): string | false {
                    if (!isTcMermaidToken(token)) {
                        return false;
                    }
                    const { classes: words, attributes } = parseOptions(
                        token.info
                    );
                    const figureClasses = [
                        'tc-mermaid',
                        ...words.filter((word) =>
                            FRAGMENT_WORD_REGEX.test(word)
                        ),
                    ];
                    const diagramClasses = [
                        'tc-mermaid-diagram',
                        ...words.filter(
                            (word) => !FRAGMENT_WORD_REGEX.test(word)
                        ),
                    ];
                    const diagramAttributes = [...attributes]
                        .map(
                            ([name, value]) => ` ${name}="${escapeHtml(value)}"`
                        )
                        .join('');
                    const id = counter++;
                    // The first newline after <pre> is dropped by the HTML
                    // parser: it keeps a source starting with a blank line
                    // intact.
                    return (
                        `<figure class="${figureClasses.join(' ')}" data-tc-mermaid="${id}">` +
                        `<div class="${diagramClasses.join(' ')}"${diagramAttributes}></div>` +
                        `<pre class="tc-mermaid-source">\n${escapeHtml(token.source)}</pre>` +
                        `</figure>\n`
                    );
                },
            },
        ],
    };
}
