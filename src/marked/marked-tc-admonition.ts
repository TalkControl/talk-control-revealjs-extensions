import { DEFAULT_LANGUAGE } from '../utils/const';
import { TcAdmonitionOptions } from '../models';
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

type AdmonitionLang = 'EN' | 'FR';

// Translated, human-readable labels for each type, used only when
// `accessibleTypeLabel` is enabled (see src/models.ts for the option).
const admonitionLabels: Record<
    (typeof typesIcons)[number],
    Record<AdmonitionLang, string>
> = {
    abstract: { EN: 'Abstract', FR: 'Résumé' },
    info: { EN: 'Info', FR: 'Info' },
    tip: { EN: 'Tip', FR: 'Astuce' },
    note: { EN: 'Note', FR: 'Remarque' },
    success: { EN: 'Success', FR: 'Succès' },
    question: { EN: 'Question', FR: 'Question' },
    warning: { EN: 'Warning', FR: 'Attention' },
    failure: { EN: 'Failure', FR: 'Échec' },
    danger: { EN: 'Danger', FR: 'Danger' },
    important: { EN: 'Important', FR: 'Important' },
    bug: { EN: 'Bug', FR: 'Bug' },
    example: { EN: 'Example', FR: 'Exemple' },
    quote: { EN: 'Quote', FR: 'Citation' },
    custom: { EN: 'Custom', FR: 'Personnalisé' },
};

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

/**
 * Resolves the language to use for the accessible type label from the slides'
 * `data-lang` attribute (managed by the `tc-i18n` addon, see
 * `src/addons/tc-i18n.ts`). The library never reads/writes `<html lang>`
 * (see #109) - only the `.reveal .slides` element it already manages.
 */
function resolveAdmonitionLang(): AdmonitionLang {
    const slidesElement = document.querySelector('.reveal .slides');
    const lang = slidesElement?.getAttribute('data-lang')?.toUpperCase();
    return lang === 'FR' ? 'FR' : (DEFAULT_LANGUAGE as AdmonitionLang);
}

/**
 * Resolves the accessible (translatable) label for a given admonition token.
 * A `custom` admonition with author-provided text (`tc-admonition-type`) uses
 * that text verbatim (it cannot be auto-translated); otherwise falls back to
 * the translated generic label for the type.
 */
function resolveAccessibleLabel(
    typeIcon: string,
    customType: string | undefined,
    lang: AdmonitionLang
): string {
    if (customType) {
        return customType;
    }
    const labels = admonitionLabels[typeIcon];
    return (
        labels?.[lang] ??
        labels?.[DEFAULT_LANGUAGE as AdmonitionLang] ??
        typeIcon
    );
}

interface TcAdmonitionToken extends marked.Tokens.Generic {
    type: 'admonitionTc';
    raw: string;
    typeIcon: string;
    customType?: string;
    customColor?: string;
    tokens: marked.Token[];
}

export function markedTcAdmonition(
    options: TcAdmonitionOptions = {}
): marked.MarkedExtension {
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
                    if (options.accessibleTypeLabel && paragraph) {
                        // Opt-in a11y enhancement (#104): expose the type as real,
                        // visually-hidden, translated text instead of relying solely
                        // on the decorative CSS `::before` content. The modifier
                        // class also tells admonition.scss to hide that decorative
                        // content, avoiding a double (visual/vocal) announcement.
                        paragraph.classList.add('tc-admonition-a11y');
                        paragraph.setAttribute('role', 'note');
                        const lang = resolveAdmonitionLang();
                        const label = resolveAccessibleLabel(
                            token.typeIcon,
                            token.customType,
                            lang
                        );
                        const labelSpan = htmlDoc.createElement('span');
                        labelSpan.className = 'tc-visually-hidden';
                        labelSpan.textContent = `${label}: `;
                        paragraph.insertBefore(labelSpan, paragraph.firstChild);
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
