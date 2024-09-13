import { ThemeInitializer } from '../web_modules/talk-control-revealjs-extensions/talk-control-revealjs-extensions.js';

// One method per module
function schoolSlides() {
    return ['00_intro.md', '03-classics/10_chapter1.md'];
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
