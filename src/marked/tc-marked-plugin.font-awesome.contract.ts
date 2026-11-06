/**
 * @vitest-environment jsdom
 */
/**
 * Characterization snapshot of the Font Awesome icons (reveal.js 5.1.0).
 *
 * Kept in its own test file (own module graph): the Font Awesome pack imports
 * `@fortawesome/fontawesome-free/js/all.js`, which replaces `<i>` tags by
 * `<svg>` and observes the DOM. We disable that DOM replacement through the
 * official `FontAwesomeConfig` global (not a mock) so that the snapshot only
 * captures the Markdown output, as the other corpus cases do.
 */
import { RenderedCorpus, renderCorpus } from './__fixtures__/render-corpus';
import { beforeAll, describe, expect, it } from 'vitest';

describe('RevealTalkControlMarkdownPlugin contract (Font Awesome)', () => {
    let rendered: RenderedCorpus;

    beforeAll(async () => {
        (window as unknown as Record<string, unknown>).FontAwesomeConfig = {
            autoReplaceSvg: false,
            observeMutations: false,
        };
        const { fontAwesomeIconPack } = await import(
            '../icons-config/font-awesome-pack'
        );
        const { featherIconPack } = await import(
            '../icons-config/feather-icons-pack'
        );
        const { materialSymbolsIconPack } = await import(
            '../icons-config/material-symbols-pack'
        );
        // Same order as the demo deck (demo/scripts/slides.js).
        rendered = await renderCorpus(
            ['icons-font-awesome'],
            [
                fontAwesomeIconPack(),
                featherIconPack(),
                materialSymbolsIconPack(),
            ]
        );
    });

    it('matches the snapshot of icons-font-awesome', async () => {
        const html = rendered.html.get('icons-font-awesome');
        expect(html).toContain('fa-user');
        expect(html).not.toContain('<svg');
        await expect(html).toMatchFileSnapshot(
            './__snapshots__/corpus/icons-font-awesome.html'
        );
    });
});
