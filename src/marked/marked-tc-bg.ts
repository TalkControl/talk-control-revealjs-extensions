// Code from taken from https://github.com/kuroidoruido/js-libs/blob/main/libs/marked-djot-div
import { marked } from 'marked';

const bgRegex = new RegExp(`!\\[\\]\\((.*)\\s+["']tc-bg["']\\)`);
const tokenizerRule = new RegExp(`^${bgRegex.source}`);
const TYPE_BG_TC = 'bgTc';

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

interface TcBgToken extends marked.Tokens.Generic {
    type: 'bgTc';
    raw: string;
    iconHref: string;
}

export function markedTcBg(): marked.MarkedExtension {
    return {
        extensions: [
            {
                name: TYPE_BG_TC,
                level: 'block',
                start(src: string): number | undefined {
                    return src.match(bgRegex)?.index;
                },
                tokenizer(src): TcBgToken | undefined {
                    const match = tokenizerRule.exec(src);
                    if (!isDefined(match)) {
                        return undefined;
                    }
                    const iconHref = match?.[1];

                    const token: TcBgToken = {
                        type: TYPE_BG_TC,
                        raw: match?.[0],
                        iconHref,
                    };
                    return token;
                },
                renderer(token) {
                    if (!isTcBgToken(token)) {
                        return false;
                    }
                    return `<!-- .slide: data-background="${token.iconHref}" -->`;
                },
            },
        ],
    };
}

export function isTcBgToken(
    token: TcBgToken | { type: unknown },
): token is TcBgToken {
    return token.type === TYPE_BG_TC;
}
