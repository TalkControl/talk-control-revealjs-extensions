import {
    Reveal,
    ThemeInitializer,
    featherIconPack,
    fontAwesomeIconPack,
    materialSymbolsIconPack,
} from '../web_modules/talk-control-revealjs-extensions/talk-control-revealjs-extensions.js';

console.log('Reveal version', Reveal.VERSION);
console.log('Reveal instance', Reveal);

// One method per module
function schoolSlides() {
    const dir = '01-classics';
    return [
        '00_intro.md',
        `${dir}/10_chapter1.md`,
        `${dir}/20_transitions.md`,
        `${dir}/30_code_slides.md`,
        `${dir}/40_custom_bg_slides.md`,
    ];
}

function speakerSlides() {
    const dir = '02-speaker';
    return [`${dir}/01_speaker.md`];
}

function layoutsSlides() {
    const dir = '03-layouts';
    return [`${dir}/10_chapter.md`, `${dir}/20_multiple-columns.md`];
}

function helpersSlides() {
    const dir = '10-helpers';
    return [
        `${dir}/10_chapter.md`,
        `${dir}/11_images.md`,
        `${dir}/12_backgrounds.md`,
        `${dir}/20_icons.md`,
        `${dir}/30_admonitions.md`,
        `${dir}/40_quotes.md`,
    ];
}

function toolsSlides() {
    const dir = '20-tools';
    return [
        `${dir}/01_i18n.md`,
        `${dir}/02_data-type.md`,
        `${dir}/03_theme.md`,
    ];
}

function formation() {
    return [
        //
        ...schoolSlides(),
        ...speakerSlides(),
        ...layoutsSlides(),
        ...helpersSlides(),
        ...toolsSlides(),
    ].map((slidePath) => {
        return { path: slidePath };
    });
}

await ThemeInitializer.init({
    slidesFactory: formation,
    tcMarkedOptions: {
        fontIcons: [
            fontAwesomeIconPack(),
            featherIconPack(),
            materialSymbolsIconPack(),
        ],
        knowStyles: ['custom-img-style'],
    },
    tcI18nOptions: {
        baseMarkdownPath: 'markdown/',
    },
    tcCustomBackgroundOptions: {
        basePath: '/assets/images/',
        mapBackgrounds: (theme) => {
            return {
                'yellow-slide': 'yellow',
                'orange-slide': '#f9cb9c',
                'transition-wall': theme === 'dark' ? 'party.jpg' : 'wall.jpg',
            };
        },
    },
    tcThemeOptions: {},
});
