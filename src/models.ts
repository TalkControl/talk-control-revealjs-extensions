import Reveal from 'reveal.js';
import { marked } from 'marked';

export interface SlidePath {
    path: string;
}

export interface RevealMarkdownPlugin {
    id: string;
    marked: { use: (ext: marked.MarkedExtension) => void };
    init(reveal: Reveal.Api): void | Promise<unknown>;
    processSlides(): void;
    convertSlides(): void;
    slidify(): void;
}

export interface SlideTreeEntry {
    prefix: string;
    path: string;
    index: number;
    check: boolean;
}

/**
 * Options for the admonition marked extension (see `src/marked/marked-tc-admonition.ts`).
 */
export interface TcAdmonitionOptions {
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
