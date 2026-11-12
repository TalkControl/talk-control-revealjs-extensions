import { CSSResult } from 'lit';
import { LitElement } from 'lit';
import { marked } from 'marked';
import { PluginFunction } from 'reveal.js';
import { default as Reveal_2 } from 'reveal.js';
import { RootPart } from 'lit-html';
import { TemplateResult } from 'lit-html';

export declare function featherIconPack(): MarkedTcIconsOptions;

export declare function fontAwesomeIconPack(): MarkedTcIconsOptions;

/**
 * Since CSS makes use of data-* attributes, we need to persist URL parameters there, giving
 * them priority over anything that would already be there.
 * @param {*} urlParams = new URLSearchParams(window.location.search)
 * @param {*} queryParam  = Search parameter (theme, type, data-lang)
 * @param {*} slidesElement = the html Elements corresponding to the slides
 * @param {*} htmlParam  = the data-* attribute to set (data-theme-slides, data-type-show, data-lang)
 * @param {*} defaultValue the default value of the attribute
 * @returns
 */
export declare function _handle_parameter(urlParams: URLSearchParams, queryParam: string, slidesElement: HTMLElement, htmlParam: string, defaultValue: string): string;

declare interface MarkedTcIconsOptions {
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

declare interface MarkedTcQrCodeOptions {
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

export declare function materialSymbolsIconPack(): MarkedTcIconsOptions;

export { Reveal_2 as Reveal }

declare interface RevealConfig {
    navigationMode?: 'linear' | 'grid';
}

export declare interface RevealMarkdownPlugin {
    id: string;
    marked: {
        use: (ext: marked.MarkedExtension) => void;
    };
    init(reveal: Reveal_2.Api): void | Promise<unknown>;
    processSlides(): void;
    convertSlides(): void;
    slidify(): void;
}

export declare interface SlidePath {
    path: string;
}

export declare interface SlideTreeEntry {
    prefix: string;
    path: string;
    index: number;
    check: boolean;
}

declare interface TalkControlMarkedOptions {
    fontIcons?: MarkedTcIconsOptions[];
    knowStyles?: string[];
    qrcode?: MarkedTcQrCodeOptions;
    admonitionOptions?: TcAdmonitionOptions;
}

/**
 * Options for the admonition marked extension (see `src/marked/marked-tc-admonition.ts`).
 */
export declare interface TcAdmonitionOptions {
    /**
     * Opt-in accessibility enhancement (disabled by default to keep the default
     * markup unchanged for backward compatibility).
     *
     * Today, an admonition's type (e.g. "Note", "Warning") is only conveyed through
     * decorative CSS (`content: '📝 Note'` in `admonition.scss`): it isn't translated,
     * it's read inconsistently (or not at all) by screen readers, and when it is read
     * the emoji is announced literally.
     *
     * When enabled, the type is additionally exposed as real, visually-hidden text in
     * the DOM — translated according to the slides' current `data-lang` (built-in
     * `EN`/`FR`, plus any language supplied via `labels`) — and the admonition
     * paragraph is given `role="note"`. To avoid announcing the type twice, the
     * decorative CSS content is hidden whenever this option is active (see the
     * `.tc-admonition-a11y` modifier in `admonition.scss`).
     */
    accessibleTypeLabel?: boolean;
    /**
     * Translated type labels for languages beyond the built-in `EN`/`FR`, keyed by
     * the same `data-lang` value the deck already uses (see `tc-i18n`), then by
     * admonition type (`note`, `warning`, ... or a custom `tc-admonition-type`).
     * Only used when `accessibleTypeLabel` is enabled. A language entry here is
     * merged with (and takes priority over) a built-in `EN`/`FR` translation for
     * the same key, so this can also be used to override a single built-in label.
     *
     * @example
     * ```javascript
     * labels: {
     *     ES: { note: 'Nota', warning: 'Advertencia' },
     * }
     * ```
     */
    labels?: Record<string, Record<string, string>>;
}

export declare class TcConfiguratorElement extends LitElement {
    static shadowRootOptions: {
        delegatesFocus: boolean;
        clonable?: boolean;
        customElementRegistry?: CustomElementRegistry;
        mode: ShadowRootMode;
        serializable?: boolean;
        slotAssignment?: SlotAssignmentMode;
    };
    slides: SlideTreeEntry[];
    theme: string;
    defaultTheme: string;
    type: string;
    defaultType: string;
    i18n: string;
    defaultI18n: string;
    revealOptions: Record<string, unknown>;
    private selectedTab;
    private isApplying;
    render(): TemplateResult<1>;
    selectTab(tab: 'talk-control' | 'revealjs'): void;
    private handleTabKeydown;
    /**
     * Focus trap: keeps Tab / Shift+Tab navigation inside the dialog so it
     * never escapes to the rest of the page, including across the shadow
     * roots of the nested `tc-talk-control-element` / `tc-revealjs-element`.
     */
    private handleDialogKeydown;
    firstUpdated(): void;
    /**
     * Moves initial focus into the dialog when it opens, so keyboard users
     * land inside the focus trap rather than on whatever was focused (or
     * the document body) before it appeared.
     */
    private focusFirstElement;
    private onConfigChanged;
    /**
     * Handler method that deals with the apply button. it will refresh the page
     */
    applyConfiguration(): void;
    private buildConfigurationUrl;
    closeUI(): void;
    static styles: CSSResult;
}

declare interface TcCustomBackgroundMap {
    [key: string]: string;
}

declare interface TcCustomBackgroundOptions {
    basePath: string;
    mapBackgrounds: (theme?: string) => TcCustomBackgroundMap;
}

declare interface TcI18nConfig {
    baseMarkdownPath: string;
    defaultLang?: string;
}

export declare class TcRevealjsElement extends LitElement {
    revealOptions: RevealConfig;
    private shortcuts;
    private editMode;
    static styles: CSSResult;
    protected firstUpdated(): void;
    protected updated(changedProperties: Map<string | number | symbol, unknown>): void;
    private updateShortcuts;
    private handleNavigationModeChange;
    private handleShortcutChange;
    render(): TemplateResult<1>;
    renderFooterEdit(): TemplateResult<1>;
}

export declare class TcTalkControlElement extends LitElement {
    static shadowRootOptions: {
        delegatesFocus: boolean;
        clonable?: boolean;
        customElementRegistry?: CustomElementRegistry;
        mode: ShadowRootMode;
        serializable?: boolean;
        slotAssignment?: SlotAssignmentMode;
    };
    slides: SlideTreeEntry[];
    theme: string;
    defaultTheme: string;
    type: string;
    defaultType: string;
    i18n: string;
    defaultI18n: string;
    private validationErrors;
    private isDirty;
    render(): TemplateResult<1>;
    private onSlideSelected;
    private onThemeInput;
    private onLanguageInput;
    private onTypeInput;
    private onFormInput;
    private onFormChange;
    private markAsDirty;
    private emitConfigChange;
    /**
     * Validation du thème
     */
    private validateTheme;
    /**
     * Validation de la langue
     */
    private validateLanguage;
    /**
     * Validation du type
     */
    private validateType;
    /**
     * Validation complète du formulaire
     */
    private validateForm;
    /**
     * Vérifier si le formulaire est valide
     */
    private isFormValid;
    /**
     * Définir une erreur de validation
     */
    private setValidationError;
    /**
     * Effacer une erreur de validation
     */
    private clearValidationError;
    /**
     * Gestion générale des erreurs
     */
    private handleError;
    /**
     * Méthode publique pour réinitialiser le formulaire
     */
    resetForm(): void;
    /**
     * Méthode publique pour valider le formulaire
     */
    validate(): boolean;
    /**
     * Méthode publique pour obtenir la configuration actuelle
     */
    getConfiguration(): {
        theme: string;
        i18n: string;
        type: string;
        slides: SlideTreeEntry[];
        isValid: boolean;
        isDirty: boolean;
    };
    /**
     * Gestion du focus initial
     */
    firstUpdated(): void;
    static styles: CSSResult;
}

declare interface TcThemeOptions {
    defaultTheme?: string;
}

/**
 * The tree checkbox element
 *
 * @csspart button - The button
 */
export declare class TcTreeSlidesElement extends LitElement {
    slides: SlideTreeEntry[];
    private treeArray;
    render(): TemplateResult<1>;
    /**
     *
     * @param {*} key the prefix of the tree. Key could be a path if no prefix
     * @param {*} value the array of path under the prefix. Value could be null if no prefix.
     * @returns the render litHTML Method
     */
    renderTreeElement(key: string | SlideTreeEntry, value?: SlideTreeEntry[] | undefined): TemplateResult<1>;
    /**
     * Method that render a leaf of the tree
     * @param {*} slide : a slide element with path, index, check, prefix
     * @returns the render method
     */
    renderLiElement(slide: SlideTreeEntry): TemplateResult<1>;
    /**
     * Handler method that deals with the checkbox of the prefix.
     * This method will update the state and the session storage and reset the UI
     * @param {*} event : click event
     * @param {*} prefix : the prefix of the slides (to update the state of children slides)
     */
    checkPrefix(event: InputEvent, prefix: string): void;
    /**
     * Handler method that deals with the checkbox of a slide.
     * This method will update the state and the session storage and reset the UI
     * @param {*} event : click event
     * @param {*} index : the index of the slide in the state
     */
    checkSlide(event: InputEvent, index: number): void;
    /**
     *
     * Utilities methods
     */
    fireSlidesSelected(): void;
    /**
     * Method to recalculate the slides
     */
    recalculateSlides(): void;
    /**
     * Transform the slides array to a tree structure to render it
     * it will only allow a one level tree depth.
     *
     * All the path with no prefix will be in the first element of the array
     * @returns the tree structure of slides in an array
     */
    createTreeFromSlides(slidesEntries: SlideTreeEntry[]): (SlideTreeEntry[] | [string, SlideTreeEntry[]])[];
    static styles: CSSResult;
}

export declare const ThemeInitializer: {
    /**
     * @param {() => Array.<string>} slidesFactory
     */
    init({ activeCopyClipboard, slidesFactory, tcMarkedOptions, tcI18nOptions, tcCustomBackgroundOptions, tcThemeOptions, defaultSlidesType, slidesRenderer, plugins, }: ThemeInitializerOptions): Promise<void>;
};

/**
 *
 */
export declare interface ThemeInitializerOptions {
    slidesFactory: (showType?: string) => SlidePath[];
    activeCopyClipboard?: boolean;
    tcMarkedOptions?: TalkControlMarkedOptions;
    tcI18nOptions?: TcI18nConfig;
    tcCustomBackgroundOptions?: TcCustomBackgroundOptions;
    tcThemeOptions?: TcThemeOptions;
    slidesRenderer?: (element: HTMLElement, slides: SlidePath[]) => RootPart;
    defaultSlidesType?: string;
    plugins?: PluginFunction[];
}

export { }
