/**
 * @vitest-environment jsdom
 */
/**
 * "Two engines" contract: every TalkControl marked extension must produce the
 * same HTML on
 *   (a) the `marked` of the project (a fresh `Marked` instance), and
 *   (b) the engine really embedded by the reveal.js markdown plugin
 *       (`plugin.marked` after `init`, no mock).
 *
 * Why: `marked` is no longer a peer dependency, the extensions run on whatever
 * engine reveal.js ships. This test proves they behave identically on the
 * project's marked (used by specs and type-checking) and on reveal's one.
 *
 * Limit: reveal's engine is a module singleton and the plugin registers every
 * extension on it at once, so an extension cannot be isolated on (b). We
 * therefore apply the full stack on both engines, in the plugin's order, and
 * compare the output for the corpus file that exercises each extension.
 *
 * Known, legitimate divergence (not a TalkControl extension): fenced code
 * blocks. The reveal.js markdown plugin installs its own `code` renderer
 * (`<code class="xml">`, no trailing newline), whereas a bare marked emits
 * `<code class="language-xml">`. `<pre>` blocks are therefore masked before
 * comparing, so that the contract only covers TalkControl-owned output.
 */
import { Marked, marked as markedNs } from 'marked';
import { beforeAll, describe, expect, it } from 'vitest';
import { RevealTalkControlMarkdownPlugin } from './tc-marked-plugin';
import { featherIconPack } from '../icons-config/feather-icons-pack';
import { fontAwesomeIconPack } from '../icons-config/font-awesome-pack';
import { materialSymbolsIconPack } from '../icons-config/material-symbols-pack';
import fs from 'node:fs';
import { markedTcAdmonition } from './marked-tc-admonition';
import { markedTcBg } from './marked-tc-bg';
import { markedTcCols } from './marked-tc-cols';
import { markedTcIcons } from './marked-tc-icons';
import { markedTcQrCode } from './marked-tc-qrcode';
import { markedTcStyledImage } from './marked-tc-styled-image';
import { normalizeHtml } from '../../tests/contract/normalize';
import path from 'node:path';
import { vi } from 'vitest';

const CORPUS = path.resolve(import.meta.dirname, '__fixtures__', 'corpus');

const EXTENSION_CORPUS: Record<string, string[]> = {
    bg: ['backgrounds'],
    cols: ['columns'],
    admonition: ['admonitions'],
    qrcode: ['qrcode'],
    icons: ['icons', 'icons-font-awesome'],
    'styled-image': ['styled-images'],
};

/** Masks `<pre>` blocks, owned by the engine core / reveal (see header). */
const maskCode = (html: string): string =>
    html.replace(/<pre>[\s\S]*?<\/pre>\n*/g, '<pre/>\n');

type Engine = { parse(src: string): string | Promise<string> };

describe('TalkControl marked extensions on both engines', () => {
    let reveal: Engine;
    let project: Engine;
    // Same pack order as the demo deck and as the corpus contract.
    const packs = () => [
        fontAwesomeIconPack(),
        featherIconPack(),
        materialSymbolsIconPack(),
    ];

    beforeAll(async () => {
        document.body.innerHTML =
            '<div class="reveal"><div class="slides"></div></div>';
        const plugin = new RevealTalkControlMarkdownPlugin({
            fontIcons: packs(),
        }).getPlugin()() as unknown as {
            init(r: unknown): Promise<unknown> | void;
            marked: Engine | null;
        };
        await plugin.init({
            getConfig: () => ({ markdown: {} }),
            getRevealElement: () => document.querySelector('.reveal'),
            on: vi.fn(),
        });
        expect(plugin.marked).not.toBeNull();
        reveal = plugin.marked as Engine;

        const engine = new Marked();
        engine.use(
            markedTcStyledImage({
                knownStyles: [
                    'center',
                    'h-400',
                    'w-500',
                    'mt-10',
                    'float-left',
                    'speaker',
                ],
            })
        );
        engine.use(markedTcBg());
        engine.use(markedTcCols());
        engine.use(markedTcAdmonition());
        engine.use(markedTcQrCode());
        for (const pack of packs()) {
            engine.use(markedTcIcons(pack));
        }
        project = engine;
    });

    it('uses a different marked instance for each engine', () => {
        expect(reveal).not.toBe(project);
        expect(markedNs).toBeDefined();
    });

    for (const [extension, cases] of Object.entries(EXTENSION_CORPUS)) {
        for (const name of cases) {
            it(`${extension}: same HTML on both engines (${name}.md)`, async () => {
                const md = fs.readFileSync(
                    path.join(CORPUS, `${name}.md`),
                    'utf8'
                );
                const a = maskCode(normalizeHtml(await project.parse(md)));
                const b = maskCode(normalizeHtml(await reveal.parse(md)));
                expect(a.length).toBeGreaterThan(0);
                expect(a).toBe(b);
            });
        }
    }
});
