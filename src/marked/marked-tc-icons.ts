// Code from taken from https://github.com/kuroidoruido/js-libs/blob/main/libs/marked-djot-div
import { marked } from 'marked';

const iconRegex = new RegExp(`!\\[\\]\\(([\\w-_\\s]+)\\s+["']([\\w-_\\s]*)["']\\)`);
const tokenizerRule = new RegExp(`^${iconRegex.source}`);
const TYPE_ICONS_TC = 'iconsTc';

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

function extractOptions(options: string, keyword: string): string {
    const optionsParts = options.split(' ').map((s) => s.trim());
    return optionsParts.filter((s) => s !== 'tc-icons' && s !== keyword && s.length > 0).join(' ').trim();
}

export interface MarkedTcIconsOptions {
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
}

export function markedTcIcons({ keyword, includesKeyword, htmlAttribute, iconInTag = false }: MarkedTcIconsOptions): marked.MarkedExtension {
    // create a regex that match ![](url 'options tc-icons ${keyword} options')

    const regexp = new RegExp(`(?=.*tc-icons)(?=.*${keyword})`, "g");
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
                    const paramsIcons = match?.[2];
                    // Secondly, we check that keywords are presents
                    if (!regexp.test(paramsIcons)) {
                        return undefined;
                    }
                    // Finally we extract options and iconHref
                    const options = extractOptions(paramsIcons, keyword);
                    const token: TcIconsToken = {
                        type: TYPE_ICONS_TC,
                        raw: match?.[0],
                        keyword,
                        options,
                        iconHref,
                    }
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
                    if (iconInTag) {
                        const strData = `${includesKeyword ? keyword + ' ' : ''} ${token.options}`.trim().replace(/\s+/g, " ");
                        return `<i ${htmlAttribute}="${strData}"${classAttr}>${token.iconHref}</i>`;
                    }
                    else {
                        const strData = `${includesKeyword ? keyword + ' ' : ''}${token.iconHref} ${token.options}`.trim().replace(/\s+/g, " ");
                        return `<i ${htmlAttribute}="${strData}"${classAttr}></i>`;
                    }
                },
            },
        ],
    };
}



export function isTcIconToken(
    token: TcIconsToken | { type: unknown }, keyword: string,
): token is TcIconsToken {
    return token.type === TYPE_ICONS_TC && (token as TcIconsToken).keyword === keyword;
}