// Code from taken from https://github.com/kuroidoruido/js-libs/blob/main/libs/marked-djot-div
import {
    escapeHtmlAttribute,
    extractFlagOption,
    extractQuotedOption,
} from '../utils/marked-inline-options';
import { marked } from 'marked';

// Group 1: iconHref, Group 2: the opening quote character ( ' or " ), Group 3: the options
// The closing quote is matched via a backreference to group 2, so the options (group 3)
// can safely contain the *other* quote character - this is what lets authors embed an
// a11y pseudo-attribute (eg. tc-a11y-label="...") inside the single-quoted title.
const iconRegex = new RegExp(
    `!\\[\\]\\(([\\w-_\\s]+)\\s+(["'])([\\s\\S]*?)\\2\\)`
);
const tokenizerRule = new RegExp(`^${iconRegex.source}`);
const TYPE_ICONS_TC = 'iconsTc';

// Pseudo-attribute keywords recognized inside the icon options string to express
// accessibility intent (see docs/icons.md "Accessibility"):
// - `tc-a11y-hidden`: the icon is decorative, it gets `aria-hidden="true"`.
// - `tc-a11y-label="..."`: the icon is meaningful, it gets that `aria-label`.
const A11Y_HIDDEN_KEYWORD = 'tc-a11y-hidden';
const A11Y_LABEL_KEYWORD = 'tc-a11y-label';

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

function extractOptions(options: string, keyword: string): string {
    const optionsParts = options.split(' ').map((s) => s.trim());
    return optionsParts
        .filter((s) => s !== 'tc-icons' && s !== keyword && s.length > 0)
        .join(' ')
        .trim();
}

export interface MarkedTcIconsOptions {
    /**
     * Copy icon Keyword to identify the copy icon
     */
    copyKeyword: string;
    /**
     * Keyword to identify the icon to use
     */
    keyword: string;
    /**
     * true if we have to se the keyword in final tag (default false)
     */
    includesKeyword?: boolean;
    /**
     * set the html attribute to use for the main tag
     */
    htmlAttribute: string;
    /**
     * true if the value of icon (draw to use) should be in the innerHTML of the tag (default false)
     */
    iconInTag?: boolean;
    /**
     * function that could be called to init the icons after the parsing
     * @returns
     */
    initFunction?: () => void;
}

interface TcIconsToken extends marked.Tokens.Generic {
    type: 'iconsTc';
    raw: string;
    keyword: string;
    iconHref: string;
    options: string;
    /**
     * true when the author marked this icon as decorative (`tc-a11y-hidden`):
     * it is rendered with `aria-hidden="true"` and has no accessible name.
     */
    a11yHidden: boolean;
    /**
     * the accessible name given by the author (`tc-a11y-label="..."`), rendered
     * as `aria-label` when the icon isn't decorative.
     */
    a11yLabel?: string;
}

export function markedTcIcons({
    keyword,
    includesKeyword,
    htmlAttribute,
    iconInTag = false,
}: MarkedTcIconsOptions): marked.MarkedExtension {
    // create a regex that match ![](url 'options tc-icons ${keyword} options')

    const regexp = new RegExp(`(?=.*tc-icons)(?=.*${keyword})`, 'g');
    /*
    (?=.*tc-icons)(?=.*${keyword}) : lookahead positive to check existence of two required words
    Else, it capture words that are not "tc-icons" ni "${keyword}"
     */
    return {
        extensions: [
            {
                name: TYPE_ICONS_TC,
                level: 'inline',
                start(src: string): number | undefined {
                    return src.match(iconRegex)?.index;
                },
                tokenizer(src): TcIconsToken | undefined {
                    // We parse in two times the regex because, it would be too slow to do it in one time
                    // First we validate the pattern like an image
                    const match = tokenizerRule.exec(src);
                    if (!isDefined(match)) {
                        return undefined;
                    }
                    const iconHref = match?.[1];
                    const paramsIconsRaw = match?.[3] ?? '';
                    // Secondly, we check that keywords are presents
                    if (!regexp.test(paramsIconsRaw)) {
                        return undefined;
                    }
                    // Extract the a11y pseudo-attributes before the generic option
                    // parsing below, since that one simply space-splits the string
                    // and would otherwise shred a quoted label into several tokens.
                    const { value: a11yLabel, remaining: withoutLabel } =
                        extractQuotedOption(paramsIconsRaw, A11Y_LABEL_KEYWORD);
                    const { present: a11yHidden, remaining: withoutA11y } =
                        extractFlagOption(withoutLabel, A11Y_HIDDEN_KEYWORD);
                    // Finally we extract options and iconHref
                    const options = extractOptions(withoutA11y, keyword);
                    const token: TcIconsToken = {
                        type: TYPE_ICONS_TC,
                        raw: match?.[0],
                        keyword,
                        options,
                        iconHref,
                        a11yHidden,
                        a11yLabel,
                    };
                    return token;
                },
                renderer(token) {
                    if (!isTcIconToken(token, keyword)) {
                        return false;
                    }
                    let classAttr = '';
                    if (htmlAttribute === 'class') {
                        token.options = `tc-icons ${token.options}`.trim();
                    } else {
                        classAttr = ` class="tc-icons${token.options?.trim() ? ' ' + token.options : ''}"`;
                        token.options = '';
                    }
                    // Decorative wins over a meaningful label if both are set: an
                    // icon can't be both hidden from and announced to the a11y tree.
                    let a11yAttr = '';
                    if (token.a11yHidden) {
                        a11yAttr = ' aria-hidden="true"';
                    } else if (token.a11yLabel) {
                        a11yAttr = ` aria-label="${escapeHtmlAttribute(token.a11yLabel)}"`;
                    }
                    if (iconInTag) {
                        const strData =
                            `${includesKeyword ? keyword + ' ' : ''} ${token.options}`
                                .trim()
                                .replace(/\s+/g, ' ');
                        return `<i ${htmlAttribute}="${strData}"${classAttr}${a11yAttr}>${token.iconHref}</i>`;
                    } else {
                        const strData =
                            `${includesKeyword ? keyword + ' ' : ''}${token.iconHref} ${token.options}`
                                .trim()
                                .replace(/\s+/g, ' ');
                        return `<i ${htmlAttribute}="${strData}"${classAttr}${a11yAttr}></i>`;
                    }
                },
            },
        ],
    };
}

export function isTcIconToken(
    token: TcIconsToken | { type: unknown },
    keyword: string
): token is TcIconsToken {
    return (
        token.type === TYPE_ICONS_TC &&
        (token as TcIconsToken).keyword === keyword
    );
}
