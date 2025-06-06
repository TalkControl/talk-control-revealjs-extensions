// Code from taken from https://github.com/kuroidoruido/js-libs/blob/main/libs/marked-djot-div
//import { ErrorCorrectLevel, createQRCode } from '../libs/pudon-qr-code-64';
import { drawImg } from '../libs/tc-qr-code-64/tc-qr-code-64';
import { marked } from 'marked';

const iconRegex = new RegExp(`!\\[\\]\\((.*)\\s+["']([\\w-_\\s]*)["']\\)`);
const tokenizerRule = new RegExp(`^${iconRegex.source}`);
const TYPE_QRCODE_TC = 'qrcodeTc';

function isDefined<T>(x: T | null | undefined): x is T {
    return x != undefined;
}

function extractOptions(options: string): string {
    const optionsParts = options.split(' ').map((s) => s.trim());
    return optionsParts
        .filter((s) => /*s !== 'tc-qrcode' && */ s.length > 0)
        .join(' ')
        .trim();
}

/**
 * Create img output element to avoid injections
 * @param {string} base64Data - src base64 data
 * @param {string} cssClass - Css classes
 * @param {string} originalText - Alt text original to help for readability
 * @returns {string} - output html
 */
function createSafeImgElement(
    base64Data: string,
    cssClass: string,
    originalText: string
): string {
    const img = document.createElement('img');
    img.src = base64Data;
    img.className = cssClass;
    // Using img.alt will automaticly escape characters
    img.alt = `qrcode with base64 information, original text is: ${originalText}`;
    return img.outerHTML;
}

interface TcQrCodeToken extends marked.Tokens.Generic {
    type: 'qrcodeTc';
    raw: string;
    iconHref: string;
    options: string;
}

export function markedTcQrCode(): marked.MarkedExtension {
    // create a regex that match ![](url 'options tc-qrcode options')

    const regexp = new RegExp(`(?=.*tc-qrcode)`, 'g');
    /*
    (?=.*tc-icons) : lookahead positive to check existence of two required words
    Else, it capture words that are not "tc-qrcode"  
     */
    return {
        extensions: [
            {
                name: TYPE_QRCODE_TC,
                level: 'inline',
                start(src: string): number | undefined {
                    return src.match(iconRegex)?.index;
                },
                tokenizer(src): TcQrCodeToken | undefined {
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
                    const options = extractOptions(paramsIcons);
                    const token: TcQrCodeToken = {
                        type: TYPE_QRCODE_TC,
                        raw: match?.[0],
                        options,
                        iconHref,
                    };
                    return token;
                },
                renderer(token) {
                    if (!isTcQrCodeToken(token)) {
                        return false;
                    }

                    console.log(token.iconHref);
                    const base64Data = drawImg(token.iconHref, { size: 500 });
                    return createSafeImgElement(
                        base64Data,
                        token.options,
                        token.iconHref
                    );
                },
            },
        ],
    };
}

export function isTcQrCodeToken(
    token: TcQrCodeToken | { type: unknown }
): token is TcQrCodeToken {
    return token.type === TYPE_QRCODE_TC;
}
