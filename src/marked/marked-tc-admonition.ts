import { marked } from 'marked';

const typesIcons = [
    'abstract',
    'info',
    'tip',
    'note',
    'success',
    'question',
    'warning',
    'failure',
    'danger',
    'important',
    'bug',
    'example',
    'quote',
    'custom',
];

const symbolRegex = new RegExp(`^!!!`);
const admonitionRegex = new RegExp(
    `${symbolRegex.source}( (${typesIcons.join('|')}))( tc-admonition-type="([^"]*)")?( tc-admonition-color="([^"]*)")?`
);
const TYPE_ADMONITION_TC = 'admonitionTc';

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

interface TcAdmonitionToken extends marked.Tokens.Generic {
    type: 'admonitionTc';
    raw: string;
    typeIcon: string;
    customType?: string;
    customColor?: string;
    tokens: marked.Token[];
}

export function markedTcAdmonition(): marked.MarkedExtension {
    return {
        extensions: [
            {
                name: TYPE_ADMONITION_TC,
                level: 'block',
                start(src: string): number | undefined {
                    return src.match(symbolRegex)?.index;
                },
                tokenizer(src): TcAdmonitionToken | undefined {
                    const match = admonitionRegex.exec(src);
                    if (!isDefined(match)) {
                        return undefined;
                    }
                    const typeIcon = match?.[2];
                    const customType = match?.[4];
                    const customColor = match?.[6];
                    const rows = src.split('\n');
                    const nextRows = rows.slice(1);
                    const closingTokenIndex = nextRows.findIndex((row) =>
                        row.match(symbolRegex)
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

                    const token: TcAdmonitionToken = {
                        type: TYPE_ADMONITION_TC,
                        raw: `${rows[0]}\n${rawContent}${closingToken}`,
                        customType,
                        customColor,
                        typeIcon,
                        tokens: [],
                    };
                    this.lexer.inlineTokens(rawContent, token.tokens);
                    return token;
                },
                renderer(token) {
                    if (!isTcAdmonitionToken(token)) {
                        return false;
                    }

                    const content = this.parser.parse(token.tokens);
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(
                        content,
                        'text/html'
                    );
                    const paragraph = htmlDoc.querySelector('p');
                    paragraph?.classList.add('admonition');
                    paragraph?.classList.add(token.typeIcon);
                    if (token.customType) {
                        paragraph?.setAttribute(
                            'data-admonition-icon',
                            token.customType
                        );
                    }
                    if (token.customColor) {
                        paragraph?.setAttribute(
                            'style',
                            `--tc-admonition-bg-color:${token.customColor};`
                        );
                    }

                    return paragraph?.outerHTML + '\n';
                },
            },
        ],
    };
}

export function isTcAdmonitionToken(
    token: TcAdmonitionToken | { type: unknown }
): token is TcAdmonitionToken {
    return token.type === TYPE_ADMONITION_TC;
}
