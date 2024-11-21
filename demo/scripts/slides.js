import {
    Reveal,
    ThemeInitializer,
} from '../web_modules/talk-control-revealjs-extensions/talk-control-revealjs-extensions.js';

console.log('Reveal version', Reveal.VERSION);
console.log('Reveal instance', Reveal);

// One method per module
function schoolSlides() {
    const dir = '03-classics';
    return [
        '00_intro.md',
        `${dir}/10_chapter1.md`,
        `${dir}/20_transitions.md`,
        `${dir}/30_code_slides.md`,
    ];
}

function formation() {
    return [
        //
        ...schoolSlides(),
    ].map((slidePath) => {
        return { path: slidePath };
    });
}

await ThemeInitializer.init(formation);
