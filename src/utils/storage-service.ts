import { SlidePath, SlideTreeEntry } from '../models';

export function saveSlidesSelected(slidesSelected: SlideTreeEntry[]): void {
    sessionStorage.setItem(
        'tc-slides-selected',
        JSON.stringify(slidesSelected)
    );
}

export function getSlidesSelected(): SlideTreeEntry[] {
    const slidesSelected = sessionStorage.getItem('tc-slides-selected');
    if (slidesSelected) {
        try {
            return JSON.parse(slidesSelected) as SlideTreeEntry[];
        } catch (error) {
            console.error(`Error parsing slides selected: ${error}`);
        }
    }
    return [];
}

export function getSlidesToUse(slides: SlidePath[]): SlidePath[] {
    // Define the slides to use (by default, whats come's in)
    let slidesToUse = slides;
    // We check if in session storage we have something
    const slidesInSession = getSlidesSelected();
    // If something is in session storage, we use it (after transformation)
    if (slidesInSession.length > 0) {
        // We update the state with the sessions storage
        // We only return the slides that are checked
        slidesToUse = slidesInSession
            .filter((elt) => elt.check)
            .map((elt) => {
                return {
                    path: elt.prefix ? elt.prefix + '/' + elt.path : elt.path,
                };
            });
    }
    return slidesToUse;
}
