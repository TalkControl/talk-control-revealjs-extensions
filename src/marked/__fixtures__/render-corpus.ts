import { MarkedTcIconsOptions } from '../marked-tc-icons';
import { RevealTalkControlMarkdownPlugin } from '../tc-marked-plugin';
import { normalizeHtml } from '../../../tests/contract/normalize';
import { vi } from 'vitest';

/**
 * Names of the corpus cases (`__fixtures__/corpus/<name>.md`), sorted.
 * Resolved at transform time by Vite, so the list is deterministic.
 */
export const CORPUS_CASES: string[] = Object.keys(
    import.meta.glob('./corpus/*.md')
)
    .map((file) => file.replace(/^\.\/corpus\/(.*)\.md$/, '$1'))
    .sort();

export interface MarkedEngineLike {
    parse?: unknown;
}

export interface RenderedCorpus {
    /** The plugin definition returned by the TalkControl wrapper. */
    plugin: ReturnType<
        ReturnType<RevealTalkControlMarkdownPlugin['getPlugin']>
    > & {
        marked?: MarkedEngineLike | null;
    };
    /** Normalized HTML of the slides generated for each case. */
    html: Map<string, string>;
}

/**
 * Renders corpus cases through the REAL markdown pipeline (no mock):
 * TalkControl wrapper → reveal.js RevealMarkdown → marked + TalkControl
 * extensions.
 *
 * Like a real deck built by `ThemeInitializer`, each case is an external
 * Markdown file loaded by reveal.js' XHR (`data-markdown="<case>.md"`, the
 * jsdom URL points to the corpus folder, see `vitest.contract.config.ts`),
 * with the TalkControl separators. All cases are rendered by a single
 * `init`, as in a real page (the marked instance of reveal.js is a module
 * singleton).
 */
export async function renderCorpus(
    cases: string[],
    fontIcons: MarkedTcIconsOptions[]
): Promise<RenderedCorpus> {
    document.body.innerHTML = '';
    const deck = document.createElement('div');
    deck.className = 'reveal';
    const slides = document.createElement('div');
    slides.className = 'slides';
    deck.append(slides);
    document.body.append(deck);

    for (const name of cases) {
        const section = document.createElement('section');
        section.setAttribute('data-markdown', `${name}.md`);
        section.setAttribute('data-separator', '##==##');
        section.setAttribute('data-separator-vertical', '##--##');
        section.setAttribute('data-separator-notes', '^Notes:');
        // Forwarded by reveal.js to the generated slides: lets us find them.
        section.setAttribute('data-corpus', name);
        slides.append(section);
    }

    const plugin = new RevealTalkControlMarkdownPlugin({
        fontIcons,
    }).getPlugin()() as RenderedCorpus['plugin'];
    const fakeReveal = {
        getConfig: () => ({ markdown: {} }),
        getRevealElement: () => deck,
        on: vi.fn(),
    };
    await plugin.init?.(
        fakeReveal as unknown as Parameters<NonNullable<typeof plugin.init>>[0]
    );

    const html = new Map<string, string>();
    for (const name of cases) {
        const generated = Array.from(slides.children).filter(
            (child) => child.getAttribute('data-corpus') === name
        );
        html.set(
            name,
            normalizeHtml(generated.map((el) => el.outerHTML).join('\n'))
        );
    }
    return { plugin, html };
}
