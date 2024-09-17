import { PluginFunction } from 'reveal.js';

export class TalkControlTheme {
    path: string = '';
    urlParams: URLSearchParams;
    slidesElement: HTMLElement | null;

    constructor() {
        this.path = '';

        const queryString = window.location.search;
        this.urlParams = new URLSearchParams(queryString);

        this.slidesElement = document.querySelector('.reveal .slides');
        if (!this.slidesElement) return;
    }

    postprocess() {
        this.path = this.extractPath();
    }

    private extractPath() {
        const links = document.getElementsByTagName('link');

        for (let idx = 0; idx < links.length; idx++) {
            const link = links.item(idx);

            if (link?.href?.match(/talk-control-reavealjs-theme\.css$/)) {
                const path = link.href;
                return path.substring(
                    0,
                    path.indexOf('css/talk-control-reavealjs-theme.css'),
                );
            }
        }
        return '';
    }
}

const RevealTalkControlThemePlugin: PluginFunction = () => {
    return {
        id: 'talk-control-theme',
        init() {
            const talkControlTheme = new TalkControlTheme();
            talkControlTheme.postprocess();
        },
    };
};

export default RevealTalkControlThemePlugin;
