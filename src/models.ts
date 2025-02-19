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
