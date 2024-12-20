import { PluginFunction } from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm';
import { RevealMarkdownPlugin } from './models';
import { markedStyledImage } from '@anthonypena/marked-styled-image';

// A wrapper around RevealMarkdown to add custom marked extensions
const RevealTalkControlMarkdownPlugin: PluginFunction = () => {
    const revealMarkdownPlugin: RevealMarkdownPlugin = RevealMarkdown() as unknown as RevealMarkdownPlugin;

    return {
        id: 'talk-control-markdown',
        init(reveal) {
            if (revealMarkdownPlugin && revealMarkdownPlugin.init) {
                const promiseInit = revealMarkdownPlugin.init(reveal);
                // We set all extensions after call of init due to the fact that the init function reset the renderer
                revealMarkdownPlugin.marked.use(markedStyledImage({ knownStyles: ['test', 'image'] }));
                return promiseInit;
            }
        },
        // Re-expose the same api as RevealMarkdown
        processSlides: revealMarkdownPlugin.processSlides,
        convertSlides: revealMarkdownPlugin.convertSlides,
        slidify: revealMarkdownPlugin.slidify,
        marked: revealMarkdownPlugin.marked
    };
};

export default RevealTalkControlMarkdownPlugin;
