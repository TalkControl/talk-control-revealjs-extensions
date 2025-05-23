import { MarkedTcIconsOptions, markedTcIcons } from './marked-tc-icons';
import { PluginFunction } from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm';
import { RevealMarkdownPlugin } from '../models';
import { markedStyledImage } from '@anthonypena/marked-styled-image';
import { markedTcAdmonition } from './marked-tc-admonition';
import { markedTcBg } from './marked-tc-bg';
import { markedTcCols } from './marked-tc-cols';

const stylesCssImg = [
    'center',
    'full-center',
    'float-left',
    'float-right',
    'full-width',
    'full-height',
];
for (let i = 1; i <= 100; i++) {
    if (i <= 20) {
        stylesCssImg.push(`h-${i * 50}`);
        stylesCssImg.push(`w-${i * 50}`);
        stylesCssImg.push(`hm-${i * 50}`);
        stylesCssImg.push(`wm-${i * 50}`);
    }
    stylesCssImg.push(`mt-${i * 10}`);
    stylesCssImg.push(`mb-${i * 10}`);
}

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
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        // A wrapper around RevealMarkdown to add custom marked extensions
        return () => {
            const revealMarkdownPlugin: RevealMarkdownPlugin =
                RevealMarkdown() as unknown as RevealMarkdownPlugin;

            return {
                id: 'talk-control-markdown',
                init(reveal) {
                    if (revealMarkdownPlugin && revealMarkdownPlugin.init) {
                        const promiseInit = revealMarkdownPlugin.init(reveal);
                        // We set all extensions after call of init due to the fact that the init function reset the renderer
                        const knownStyles = self.options.knowStyles ?? [];
                        knownStyles.push(...stylesCssImg);
                        revealMarkdownPlugin.marked.use(
                            markedStyledImage({
                                knownStyles,
                            })
                        );
                        revealMarkdownPlugin.marked.use(markedTcBg());
                        revealMarkdownPlugin.marked.use(markedTcCols());
                        revealMarkdownPlugin.marked.use(markedTcAdmonition());
                        const initFunctionArray: Array<() => void> = [];
                        if (
                            self.options.fontIcons &&
                            self.options.fontIcons.length > 0
                        ) {
                            for (const fontIconsToUse of self.options
                                .fontIcons) {
                                revealMarkdownPlugin.marked.use(
                                    markedTcIcons(fontIconsToUse)
                                );
                                if (fontIconsToUse.initFunction) {
                                    initFunctionArray.push(
                                        fontIconsToUse.initFunction
                                    );
                                }
                            }
                        }
                        if (initFunctionArray.length > 0) {
                            reveal.on('ready', () => {
                                for (const initFunction of initFunctionArray) {
                                    initFunction();
                                }
                            });
                        }
                        return promiseInit;
                    }
                },
                // Re-expose the same api as RevealMarkdown
                processSlides: revealMarkdownPlugin.processSlides,
                convertSlides: revealMarkdownPlugin.convertSlides,
                slidify: revealMarkdownPlugin.slidify,
                marked: revealMarkdownPlugin.marked,
            };
        };
    }
}
