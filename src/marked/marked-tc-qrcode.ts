// Code from taken from https://github.com/kuroidoruido/js-libs/blob/main/libs/marked-djot-div
//import { ErrorCorrectLevel, createQRCode } from '../libs/pudon-qr-code-64';
import { DEFAULT_LANGUAGE } from '../utils/const';
import { drawImg } from '../libs/tc-qr-code-64/tc-qr-code-64';
import { extractQuotedOption } from '../utils/marked-inline-options';
import { marked } from 'marked';

// Group 1: iconHref (the text to encode), Group 2: the opening quote character
// ( ' or " ), Group 3: the options. The closing quote is matched via a backreference
// to group 2, so the options (group 3) can safely contain the *other* quote
// character - this is what lets authors embed the `tc-qrcode-alt="..."`
// pseudo-attribute inside the single-quoted title.
const iconRegex = new RegExp(`!\\[\\]\\((.*)\\s+(["'])([\\s\\S]*?)\\2\\)`);
const tokenizerRule = new RegExp(`^${iconRegex.source}`);
const TYPE_QRCODE_TC = 'qrcodeTc';

// Pseudo-attribute recognized inside the qrcode options string to override the
// generated image's alt text for this QR code (see docs/qrcode.md "Accessibility").
const ALT_KEYWORD = 'tc-qrcode-alt';

// Legacy, English-only default alt text, kept byte-for-byte as the fallback when
// neither a per-instance `tc-qrcode-alt` nor a `defaultAlt` option is configured.
const LEGACY_DEFAULT_ALT_TEMPLATE =
    'qrcode with base64 information, original text is: {{text}}';
const ALT_TEXT_PLACEHOLDER = '{{text}}';

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
 * Resolves the current slide language, using the same `data-lang` attribute (set on
 * `.reveal .slides`) that the `tc-i18n` addon reads and writes.
 * @returns the current language code, or the library's default language when unset
 */
function getCurrentLang(): string {
    return (
        document.querySelector('.reveal .slides')?.getAttribute('data-lang') ??
        DEFAULT_LANGUAGE
    );
}

/**
 * Resolves the default alt text template to use for a QR code that has no
 * per-instance `tc-qrcode-alt` override.
 * @param {MarkedTcQrCodeOptions['defaultAlt']} defaultAlt - the configured default alt option
 * @returns a template string that may contain the `{{text}}` placeholder
 */
function resolveDefaultAltTemplate(
    defaultAlt: MarkedTcQrCodeOptions['defaultAlt']
): string {
    if (!defaultAlt) {
        return LEGACY_DEFAULT_ALT_TEMPLATE;
    }
    if (typeof defaultAlt === 'string') {
        return defaultAlt;
    }
    const lang = getCurrentLang();
    return (
        defaultAlt[lang] ??
        defaultAlt[DEFAULT_LANGUAGE] ??
        LEGACY_DEFAULT_ALT_TEMPLATE
    );
}

function buildAltText(template: string, originalText: string): string {
    // split/join avoids both the ES2021 `replaceAll` dependency and the special
    // meaning of `$`-patterns that `String.replace` would apply to originalText.
    return template.split(ALT_TEXT_PLACEHOLDER).join(originalText);
}

/**
 * Create img output element to avoid injections
 * @param {string} base64Data - src base64 data
 * @param {string} cssClass - Css classes
 * @param {string} altText - the alt text to apply (already resolved/localized)
 * @returns {string} - output html
 */
function createSafeImgElement(
    base64Data: string,
    cssClass: string,
    altText: string
): string {
    const img = document.createElement('img');
    img.src = base64Data;
    img.className = cssClass;
    // Using img.alt will automaticly escape characters
    img.alt = altText;
    return img.outerHTML;
}

interface TcQrCodeToken extends marked.Tokens.Generic {
    type: 'qrcodeTc';
    raw: string;
    iconHref: string;
    options: string;
    /**
     * author-provided alt text override (`tc-qrcode-alt="..."`), takes precedence
     * over `MarkedTcQrCodeOptions.defaultAlt` when present.
     */
    qrcodeAlt?: string;
}

export interface MarkedTcQrCodeOptions {
    /**
     * Default alt text used for every QR code that doesn't set its own
     * `tc-qrcode-alt="..."` override. Use the `{{text}}` placeholder for the
     * encoded text.
     *
     * Can be a single string (applied regardless of language), or a map keyed by
     * the `data-lang` language code (same convention as the `tc-i18n` addon, eg.
     * `EN`/`FR`) to localize the message according to the current slide language.
     *
     * When omitted, the legacy English message
     * ("qrcode with base64 information, original text is: ...") is used unchanged.
     */
    defaultAlt?: string | Record<string, string>;
}

export function markedTcQrCode(
    options: MarkedTcQrCodeOptions = {}
): marked.MarkedExtension {
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
                    const paramsIconsRaw = match?.[3] ?? '';
                    // Secondly, we check that keywords are presents
                    if (!regexp.test(paramsIconsRaw)) {
                        return undefined;
                    }
                    // Extract the alt override before the generic option parsing
                    // below, since that one simply space-splits the string and
                    // would otherwise shred a quoted alt text into several tokens.
                    const { value: qrcodeAlt, remaining } = extractQuotedOption(
                        paramsIconsRaw,
                        ALT_KEYWORD
                    );
                    // Finally we extract options and iconHref
                    const optionsClean = extractOptions(remaining);
                    const token: TcQrCodeToken = {
                        type: TYPE_QRCODE_TC,
                        raw: match?.[0],
                        options: optionsClean,
                        iconHref,
                        qrcodeAlt,
                    };
                    return token;
                },
                renderer(token) {
                    if (!isTcQrCodeToken(token)) {
                        return false;
                    }

                    const base64Data = drawImg(token.iconHref, { size: 500 });
                    const altText = token.qrcodeAlt
                        ? token.qrcodeAlt
                        : buildAltText(
                              resolveDefaultAltTemplate(options.defaultAlt),
                              token.iconHref
                          );
                    return createSafeImgElement(
                        base64Data,
                        token.options,
                        altText
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
