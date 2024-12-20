// Code from taken from https://github.com/kuroidoruido/js-libs/blob/main/libs/marked-djot-div
import { marked } from 'marked';

const REGEX = /!\[\]\(([\w-_\s]+)\s+["']([\w-_\s]*)["']\)/;
const TYPE_ICONS_TC = 'iconsTc';

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

function extractOptions(options: string, keyword: string): string {
    const optionsParts = options.split(' ').map((s) => s.trim());
    return optionsParts.filter((s) => s !== 'tc-icons' && s !== keyword && s.length > 0).join(' ').trim();
}

export interface MarkedTcIconsOptions {
    keyword: string;
    includesKeyword: boolean;
    htmlAttribute: string;
    iconInTag?: boolean;
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
                tokenizer(src): TcIconsToken | undefined {
                    // We parse in two times the regex because, it would be too slow to do it in one time
                    // First we validate the pattern like an image
                    const match = REGEX.exec(src);
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
                        classAttr = ` class="tc-icons"`;
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