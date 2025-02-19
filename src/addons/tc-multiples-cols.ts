/**
 * Manage multiple columns by removing the stack class and adding the aria-hidden and hidden attributes (for accessibility purposes)
 */
export function manageMultiplesColumns() {
    const allSlides = [
        ...document.querySelectorAll(
            '.reveal .slides > section.tc-multiple-columns',
        ),
    ];
    for (let i = 0; i < allSlides.length; i++) {
        const slide = allSlides[i];
        slide.classList.remove('stack');
        const cols = [...slide.querySelectorAll('.tc-column section')];
        for (let j = 0; j < cols.length; j++) {
            const col = cols[j];
            col.removeAttribute('aria-hidden');
            col.removeAttribute('hidden');
        }
    }
}
