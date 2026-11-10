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
     * the DOM — translated according to the slides' current `data-lang` (`EN`/`FR`) —
     * and the admonition paragraph is given `role="note"`. To avoid announcing the
     * type twice, the decorative CSS content is hidden whenever this option is active
     * (see the `.tc-admonition-a11y` modifier in `admonition.scss`).
     */
    accessibleTypeLabel?: boolean;
}
