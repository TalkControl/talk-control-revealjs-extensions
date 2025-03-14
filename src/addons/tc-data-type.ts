import { _handle_parameter } from '../helper';

export function manageShowTypeContent(defaultType: string = 'on-stage'): void {
    const urlParams = new URLSearchParams(window.location.search);
    const slidesElement: HTMLElement =
        document.querySelector('.reveal .slides')!;
    const slidesType = _handle_parameter(
        urlParams,
        'data-type',
        slidesElement,
        'data-type',
        defaultType
    );

    if (slidesType !== 'all') {
        Array.from(slidesElement.querySelectorAll('section[data-type-show]'))
            .filter(
                (el) =>
                    el?.getAttribute('data-type-show')?.indexOf(slidesType) ===
                    -1
            )
            .forEach((el) => {
                const parentNode = el?.parentNode;
                parentNode?.removeChild(el);
                if (
                    parentNode?.nodeName === 'SECTION' &&
                    parentNode?.children?.length === 0
                ) {
                    parentNode?.parentNode?.removeChild(parentNode);
                }
            });
    }
}
