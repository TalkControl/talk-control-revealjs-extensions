import { type RevealApi } from 'reveal.js';

/**
 * reveal.js print mode: `?print-pdf`, or the `view: 'print'` config.
 * `reveal` is the API a plugin receives (the static `Reveal` only carries
 * `getConfig` once initialized, hence the optional call).
 */
export function isPrintView(reveal?: Partial<Pick<RevealApi, 'getConfig'>>) {
    return (
        reveal?.getConfig?.()?.view === 'print' ||
        /print-pdf/i.test(window.location.search)
    );
}
