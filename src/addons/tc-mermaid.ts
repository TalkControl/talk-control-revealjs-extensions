import Reveal, { type RevealApi } from 'reveal.js';
import { loadVendorModule } from '../utils/tc-vendor-loader';

export interface TcMermaidOptions {
    /**
     * Passed as is to `mermaid.initialize()`, over the TalkControl defaults
     * (`startOnLoad: false`, `securityLevel: 'strict'`, the theme and the
     * font of the deck). See https://mermaid.js.org/config/schema-docs/config.html
     */
    config?: Record<string, unknown>;
    /**
     * Maps a `data-theme` of the deck to a Mermaid theme. Default:
     * `{ dark: 'dark' }`, any other `data-theme` gives `'default'`.
     */
    themes?: Record<string, string>;
}

/** What the addon uses of the Mermaid API (the types of Mermaid are not exposed). */
interface MermaidApi {
    initialize(config: Record<string, unknown>): void;
    render(
        id: string,
        text: string,
        container?: Element
    ): Promise<{ svg: string; bindFunctions?: (element: Element) => void }>;
}

/**
 * The part of the reveal.js API the addon reads. The static `Reveal` only
 * carries it once initialized: during a plugin's `init`, pass the API the
 * plugin receives.
 */
export type TcMermaidReveal = Partial<
    Pick<RevealApi, 'getCurrentSlide' | 'getConfig'>
>;

const MERMAID_MODULE = 'mermaid/dist/mermaid.esm.min.mjs';
const FIGURE_SELECTOR = '.reveal .slides figure[data-tc-mermaid]';
const STATE_ATTRIBUTE = 'data-tc-mermaid-state';
const DEFAULT_THEMES: Record<string, string> = { dark: 'dark' };
const DEFAULT_REVEAL_WIDTH = 960;

/**
 * Turns the `<figure data-tc-mermaid>` placeholders produced by
 * `marked-tc-mermaid` into rendered diagrams.
 *
 * Mermaid is loaded (from `dist/vendor/mermaid/`) only when the deck has at
 * least one diagram. Diagrams are rendered in an off-screen container, one at
 * a time, current slide first: Mermaid measures text, and a hidden slide, a
 * fragment or a scaled `.reveal` would give wrong sizes.
 *
 * Never rejects: a failing diagram, or a Mermaid that cannot be loaded, is
 * reported on the figure (`data-tc-mermaid-state="error"`, source kept
 * visible) and in the console, and the presentation goes on. Safe to call
 * several times: a figure is rendered once.
 */
export async function manageMermaid(
    options: TcMermaidOptions = {},
    reveal: TcMermaidReveal = Reveal as unknown as TcMermaidReveal
): Promise<void> {
    const figures = collectPendingFigures(reveal);
    if (figures.length === 0) {
        return;
    }

    let mermaid: MermaidApi;
    try {
        const module = await loadVendorModule<{ default: MermaidApi }>(
            MERMAID_MODULE
        );
        mermaid = module.default;
    } catch (error) {
        console.error(error);
        for (const figure of figures) {
            showError(
                figure,
                `Mermaid could not be loaded: ${(error as Error).message}`
            );
        }
        return;
    }

    await waitForFonts();
    mermaid.initialize(buildConfig(options));

    const container = createOffscreenContainer(reveal);
    document.body.appendChild(container);
    try {
        for (const figure of figures) {
            await renderFigure(mermaid, figure, container);
        }
    } finally {
        container.remove();
    }
}

/**
 * The figures nobody took care of yet, current slide first. They are marked
 * as `rendering` right away, so a second call finds nothing left to do.
 */
function collectPendingFigures(reveal: TcMermaidReveal): HTMLElement[] {
    const figures = Array.from(
        document.querySelectorAll<HTMLElement>(
            `${FIGURE_SELECTOR}:not([${STATE_ATTRIBUTE}])`
        )
    );
    const current = reveal.getCurrentSlide?.();
    const inCurrentSlide = (figure: HTMLElement) =>
        current?.contains(figure) ? 0 : 1;
    figures.sort((a, b) => inCurrentSlide(a) - inCurrentSlide(b));
    for (const figure of figures) {
        figure.setAttribute(STATE_ATTRIBUTE, 'rendering');
    }
    return figures;
}

function buildConfig({
    config = {},
    themes = {},
}: TcMermaidOptions): Record<string, unknown> {
    const dataTheme =
        document.querySelector('.reveal .slides')?.getAttribute('data-theme') ??
        '';
    const theme = { ...DEFAULT_THEMES, ...themes }[dataTheme] ?? 'default';
    const fontFamily = readDeckFont();
    return {
        startOnLoad: false,
        securityLevel: 'strict',
        // The error is reported by TalkControl, not as a bomb added to <body>.
        suppressErrorRendering: true,
        theme,
        ...(fontFamily ? { fontFamily } : {}),
        ...config,
    };
}

function readDeckFont(): string {
    const reveal = document.querySelector('.reveal');
    return reveal
        ? getComputedStyle(reveal).getPropertyValue('--r-main-font').trim()
        : '';
}

/** Mermaid measures labels: wait for the web fonts, or they are mis-sized. */
async function waitForFonts(): Promise<void> {
    try {
        await document.fonts?.ready;
    } catch {
        // No font API or a failing one: render anyway.
    }
}

function createOffscreenContainer(reveal: TcMermaidReveal): HTMLElement {
    const width = reveal.getConfig?.()?.width;
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    // Outside `.reveal` (no `transform: scale`) and laid out (not
    // `display: none`), at the width of a slide.
    container.style.cssText =
        'position:absolute;left:-10000px;top:0;' +
        `width:${typeof width === 'number' ? width : DEFAULT_REVEAL_WIDTH}px;`;
    return container;
}

async function renderFigure(
    mermaid: MermaidApi,
    figure: HTMLElement,
    container: HTMLElement
): Promise<void> {
    const index = figure.getAttribute('data-tc-mermaid') ?? '?';
    const diagram = figure.querySelector<HTMLElement>('.tc-mermaid-diagram');
    const source = figure.querySelector('.tc-mermaid-source')?.textContent;
    if (!diagram || source == null) {
        showError(figure, 'The diagram markup is incomplete.');
        return;
    }
    try {
        const { svg, bindFunctions } = await mermaid.render(
            `tc-mermaid-${index}`,
            source,
            container
        );
        diagram.innerHTML = svg;
        bindFunctions?.(diagram);
        figure.setAttribute(STATE_ATTRIBUTE, 'rendered');
    } catch (error) {
        console.error(`tc-mermaid: diagram ${index} failed to render`, error);
        showError(figure, (error as Error).message ?? String(error));
    }
}

function showError(figure: HTMLElement, message: string): void {
    figure.setAttribute(STATE_ATTRIBUTE, 'error');
    const diagram = figure.querySelector('.tc-mermaid-diagram');
    if (diagram) {
        const element = document.createElement('p');
        element.className = 'tc-mermaid-error';
        element.textContent = message;
        diagram.replaceChildren(element);
    }
}

// Add conditionnal export for test
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? { buildConfig }
        : undefined;
