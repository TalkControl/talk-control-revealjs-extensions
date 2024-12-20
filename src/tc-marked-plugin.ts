import { markedTcIcons, MarkedTcIconsOptions } from './marked/marked-tc-icons';
import { PluginFunction } from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm';
import { RevealMarkdownPlugin } from './models';
import { markedStyledImage } from '@anthonypena/marked-styled-image';

export interface TalkControlMarkedOptions {
    fontIcons?: MarkedTcIconsOptions[];
    knowStyles?: string[];
}
export class RevealTalkControlMarkdownPlugin {

    private options: TalkControlMarkedOptions;

    constructor(options: TalkControlMarkedOptions) {
        this.options = options;
    }

    getPlugin(): PluginFunction {
        const self = this;
        // A wrapper around RevealMarkdown to add custom marked extensions
        return () => {
            const revealMarkdownPlugin: RevealMarkdownPlugin = RevealMarkdown() as unknown as RevealMarkdownPlugin;


            return {
                id: 'talk-control-markdown',
                init(reveal) {
                    if (revealMarkdownPlugin && revealMarkdownPlugin.init) {
                        const promiseInit = revealMarkdownPlugin.init(reveal);
                        // We set all extensions after call of init due to the fact that the init function reset the renderer
                        revealMarkdownPlugin.marked.use(markedStyledImage({ knownStyles: self.options.knowStyles ?? [] }));
                        if (self.options.fontIcons && self.options.fontIcons.length > 0) {
                            for (const fontIconsToUse of self.options.fontIcons) {
                                revealMarkdownPlugin.marked.use(markedTcIcons(fontIconsToUse));
                            }
                        }
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
    }
}
