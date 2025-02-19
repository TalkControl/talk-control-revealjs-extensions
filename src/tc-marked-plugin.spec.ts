/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Reveal from 'reveal.js';
import { RevealTalkControlMarkdownPlugin } from './tc-marked-plugin';

const mockInit = vi.fn();
const mockUse = vi.fn();

// Mock the import of module of RevealMarkdown plugin
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

// Get a representation of this mock class
const RevealMarkdownMock = vi.mocked(
    (await import('reveal.js/plugin/markdown/markdown.esm')).default
);


// Mock extensions used in tc plugin
vi.mock('./marked-extensions', () => ({
    markedStyledImage: vi.fn().mockReturnValue({}),
    markedTcBg: vi.fn().mockReturnValue({}),
    markedTcCols: vi.fn().mockReturnValue({}),
    markedTcIcons: vi.fn().mockReturnValue({})
}));

// Used for compilation of test
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

        // Default instance of plugin to test
        instance = new RevealTalkControlMarkdownPlugin({
            knowStyles: ['style1', 'style2'],
            fontIcons: [{
                keyword: 'fa',
                htmlAttribute: 'fa',
                initFunction: vi.fn()
            }]
        });

        // Get the plugin like reveal will do
        plugin = instance.getPlugin();
        // Mock reveal instance
        revealMock = {
            on: vi.fn()
        };
    });

    it('should create the plugin with correct ID', () => {
        const pluginInstance = plugin();
        expect(pluginInstance.id).toBe('talk-control-markdown');
    });

    it('should initialize the plugin with extensions', async () => {
        const pluginInstance = plugin();

        const revealMarkdownPlugin = RevealMarkdownMock();

        await pluginInstance.init!(revealMock as Reveal.Api);

        expect(revealMarkdownPlugin.init).toHaveBeenCalledWith(revealMock);

    });

    it('should call init methods when reveal is ready', async () => {
        const initFn = vi.fn();
        instance = new RevealTalkControlMarkdownPlugin({
            knowStyles: ['style1', 'style2'],
            fontIcons: [{
                keyword: 'fa',
                htmlAttribute: 'fa',
                initFunction: initFn
            }]
        });
        plugin = instance.getPlugin();
        const pluginInstance = plugin();

        pluginInstance.init!(revealMock as Reveal.Api);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readyCallback = ((revealMock as Reveal.Api).on as any).mock.calls[0][1];
        readyCallback();

        expect(initFn).toHaveBeenCalled();
    });

    it('should re-expose revealMardown method', () => {
        const pluginInstance = plugin();

        expect((pluginInstance as IPluginRevealMarkdown).processSlides).toBeTypeOf('function');
        expect((pluginInstance as IPluginRevealMarkdown).convertSlides).toBeTypeOf('function');
        expect((pluginInstance as IPluginRevealMarkdown).slidify).toBeTypeOf('function');
        expect((pluginInstance as IPluginRevealMarkdown).marked).toEqual({ use: mockUse });
    });
});