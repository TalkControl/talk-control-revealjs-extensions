// Code from taken from https://github.com/kuroidoruido/js-libs/blob/main/libs/marked-djot-div
import { marked } from 'marked';

const symbolRegex = new RegExp(`^##\\+\\+##`);
const colRegex = new RegExp(`${symbolRegex.source}( (.*))?`);
const TYPE_COL_TC = 'colTc';

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

export interface TcColToken extends marked.Tokens.Generic {
    type: 'colTc';
    raw: string;
    attributes?: string;
    tokens: marked.Token[];
}

export function markedTcCols(): marked.MarkedExtension {
    return {
        extensions: [
            {
                name: TYPE_COL_TC,
                level: 'block',
                start(src: string): number | undefined {
                    return src.match(symbolRegex)?.index;
                },
                tokenizer(src): TcColToken | undefined {
                    const match = colRegex.exec(src);
                    if (!isDefined(match)) {
                        return undefined;
                    }
                    const attributes = match?.[1];
                    const rows = src.split('\n');
                    const nextRows = rows.slice(1);
                    const closingTokenIndex = nextRows.findIndex((row) =>
                        row.match(symbolRegex),
                    );
                    const closingToken =
                        closingTokenIndex === -1
                            ? ''
                            : '\n' + nextRows[closingTokenIndex];
                    const sliceEnd =
                        closingTokenIndex === -1
                            ? undefined
                            : closingTokenIndex;
                    const divContent = nextRows.slice(0, sliceEnd);
                    const rawContent = divContent.join('\n');

                    const token: TcColToken = {
                        type: TYPE_COL_TC,
                        raw: `${rows[0]}\n${rawContent}${closingToken}`,
                        attributes,
                        tokens: [],
                    };
                    this.lexer.blockTokens(rawContent, token.tokens);
                    return token;
                },
                renderer(token) {
                    if (!isTcColToken(token)) {
                        return false;
                    }
                    let attributes = '';
                    let classes = '';
                    if (token.attributes) {
                        const splitAttributes = token.attributes.split(' ');
                        let attributesWithoutClasses = '';
                        for (const attr of splitAttributes) {
                            if (attr && attr.startsWith('class')) {
                                classes =
                                    ' ' +
                                    attr.substring(
                                        attr.indexOf('=') + 2,
                                        attr.length - 1,
                                    );
                            } else if (attr && attr.length > 0) {
                                attributesWithoutClasses += attr;
                            }
                        }
                        attributes = ` ${attributesWithoutClasses}`;
                    }
                    const content = this.parser.parse(token.tokens);
                    return `<div class="tc-column"><section${attributes} class="tc-column${classes}">\n${content}\n</section></div>`;
                },
            },
        ],
    };
}

export function isTcColToken(
    token: TcColToken | { type: unknown },
): token is TcColToken {
    return token.type === TYPE_COL_TC;
}
