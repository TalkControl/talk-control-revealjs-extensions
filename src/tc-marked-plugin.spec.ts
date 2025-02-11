/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Reveal from 'reveal.js';
import { RevealTalkControlMarkdownPlugin } from './tc-marked-plugin';

const mockInit = vi.fn();
const mockUse = vi.fn();

vi.mock('reveal.js/plugin/markdown/markdown.esm', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            init: mockInit,
            processSlides: vi.fn(),
            convertSlides: vi.fn(),
            slidify: vi.fn(),
            marked: {
                use: mockUse
            }
        }))
    }
});

// 4. Si tu as besoin d'accéder au mock dans tes tests
const RevealMarkdownMock = vi.mocked(
    (await import('reveal.js/plugin/markdown/markdown.esm')).default
);


// 2. On mock aussi les extensions marked personnalisées
vi.mock('./marked-extensions', () => ({
    markedStyledImage: vi.fn().mockReturnValue({}),
    markedTcBg: vi.fn().mockReturnValue({}),
    markedTcCols: vi.fn().mockReturnValue({}),
    markedTcIcons: vi.fn().mockReturnValue({})
}));

interface IPluginRevealMarkdown extends Reveal.Plugin {
    processSlides: () => void,
    convertSlides: () => void,
    slidify: () => void,
    marked: {
        use: () => void
    }
}

describe(RevealTalkControlMarkdownPlugin.name, () => {

    let instance: RevealTalkControlMarkdownPlugin;
    let revealMock: unknown;
    let plugin: Reveal.PluginFunction;

    beforeEach(async () => {
        vi.clearAllMocks();

        // 4. Initialisation de l'instance avec des options
        instance = new RevealTalkControlMarkdownPlugin({
            knowStyles: ['style1', 'style2'],
            fontIcons: [{
                keyword: 'fa',
                htmlAttribute: 'fa',
                initFunction: vi.fn()
            }]
        });

        // 5. Récupération du plugin
        plugin = instance.getPlugin();
        revealMock = {
            on: vi.fn()
        };
    });

    it('devrait créer un plugin avec le bon ID', () => {
        const pluginInstance = plugin();
        expect(pluginInstance.id).toBe('talk-control-markdown');
    });

    it('devrait initialiser correctement le plugin avec les extensions', async () => {
        const pluginInstance = plugin();

        const revealMarkdownPlugin = RevealMarkdownMock();

        await pluginInstance.init!(revealMock as Reveal.Api);

        // Utilisation de expect.anything() pour être moins strict
        expect(revealMarkdownPlugin.init).toHaveBeenCalledWith(revealMock);

    });

    it('devrait exécuter les fonctions d\'initialisation des icônes au ready', async () => {
        const pluginInstance = plugin();
        const initFn = instance!.options!.fontIcons![0].initFunction;

        pluginInstance.init!(revealMock as Reveal.Api);

        // 7. Simulation de l'événement ready
        const readyCallback = ((revealMock as Reveal.Api).on as any).mock.calls[0][1];
        readyCallback();

        expect(initFn).toHaveBeenCalled();
    });

    it('devrait exposer les méthodes de RevealMarkdown', () => {
        const pluginInstance = plugin();

        expect((pluginInstance as IPluginRevealMarkdown).processSlides).toBeTypeOf('function');
        expect((pluginInstance as IPluginRevealMarkdown).convertSlides).toBeTypeOf('function');
        expect((pluginInstance as IPluginRevealMarkdown).slidify).toBeTypeOf('function');
        expect((pluginInstance as IPluginRevealMarkdown).marked).toEqual({ use: mockUse });
    });
});