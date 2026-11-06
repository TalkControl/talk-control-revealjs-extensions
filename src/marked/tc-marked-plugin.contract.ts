/**
 * @vitest-environment jsdom
 */
/**
 * Characterization snapshots of the Markdown pipeline (reveal.js 5.1.0).
 *
 * No mock of the markdown plugin: this is the real RevealMarkdown with the
 * TalkControl extensions. Each corpus case produces a reviewable `.html`
 * snapshot in `__snapshots__/corpus/`. Any change of these files must be
 * explained in the pull request that introduces it.
 *
 * Font Awesome is covered by `tc-marked-plugin.font-awesome.contract.ts`
 * (its `all.js` patches the DOM, so it runs in its own test file).
 */
import {
    CORPUS_CASES,
    RenderedCorpus,
    renderCorpus,
} from './__fixtures__/render-corpus';
import { beforeAll, describe, expect, it } from 'vitest';
import { featherIconPack } from '../icons-config/feather-icons-pack';
import { materialSymbolsIconPack } from '../icons-config/material-symbols-pack';

const FONT_AWESOME_CASE = 'icons-font-awesome';
const CASES = CORPUS_CASES.filter((name) => name !== FONT_AWESOME_CASE);

describe('RevealTalkControlMarkdownPlugin contract (corpus)', () => {
    let rendered: RenderedCorpus;

    beforeAll(async () => {
        rendered = await renderCorpus(CASES, [
            featherIconPack(),
            materialSymbolsIconPack(),
        ]);
    });

    it('covers the whole corpus', () => {
        expect(CASES.length).toBeGreaterThanOrEqual(14);
        for (const name of CASES) {
            expect(rendered.html.get(name), name).toContain('<section');
        }
    });

    it('exposes a marked engine with parse after init', () => {
        expect(rendered.plugin.marked).not.toBeNull();
        expect(rendered.plugin.marked).toBeDefined();
        expect(typeof rendered.plugin.marked?.parse).toBe('function');
    });

    it('renders styled images with a literal src', () => {
        const html = rendered.html.get('styled-images') ?? '';
        const container = document.createElement('div');
        container.innerHTML = html;
        const images = Array.from(container.querySelectorAll('img'));
        expect(images.length).toBeGreaterThan(0);
        for (const img of images) {
            expect(img.getAttribute('src')).not.toContain('[object Object]');
            expect(img.getAttribute('src')).toMatch(/^\.\/assets\/images\//);
        }
        const mixed = images.find((img) => img.getAttribute('title'));
        expect(mixed?.getAttribute('title')).toBe('mon titre');
        expect(mixed?.getAttribute('class')).toBe('center');
    });

    it.each(CASES)('matches the snapshot of %s', async (name) => {
        await expect(rendered.html.get(name)).toMatchFileSnapshot(
            `./__snapshots__/corpus/${name}.html`
        );
    });
});
