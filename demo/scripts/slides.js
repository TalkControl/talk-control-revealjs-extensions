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
        `${dir}/20_icons.md`,
    ];
}

function toolsSlides() {
    const dir = '20-tools';
    return [`${dir}/01_i18n.md`];
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
        knowStyles: ['test', 'image'],
    },
    tcI18nOptions: {
        baseMarkdownPath: 'markdown/',
    },
});
