import { describe, expect, it } from 'vitest';
import { A11yViolation } from './types';
import { dedupeAgainstPreviousPass } from './dedupe';

function violation(
    id: string,
    context: string,
    targets: string[]
): A11yViolation {
    return {
        id,
        context,
        nodes: targets.map((target) => ({ target: [target] })),
    };
}

describe('dedupeAgainstPreviousPass', () => {
    it('should drop a node already reported by the previous pass for the same rule', () => {
        const previous = [violation('meta-viewport', 'print-pdf', ['meta'])];
        const candidates = [violation('meta-viewport', 'shell', ['meta'])];

        expect(dedupeAgainstPreviousPass(previous, candidates)).toEqual([]);
    });

    it('should keep a node not seen in the previous pass', () => {
        const previous = [violation('meta-viewport', 'print-pdf', ['meta'])];
        const candidates = [
            violation('color-contrast', 'shell', ['#ui-slide-selector h2']),
        ];

        expect(dedupeAgainstPreviousPass(previous, candidates)).toEqual(
            candidates
        );
    });

    it('should keep a node with the same selector but a different rule id', () => {
        const previous = [violation('aria-hidden-focus', 'print-pdf', ['a'])];
        const candidates = [violation('color-contrast', 'shell', ['a'])];

        expect(dedupeAgainstPreviousPass(previous, candidates)).toEqual(
            candidates
        );
    });

    it('should partially filter a violation, keeping only its untouched nodes', () => {
        const previous = [violation('meta-viewport', 'print-pdf', ['meta'])];
        const candidates = [
            violation('meta-viewport', 'shell', ['meta', '#other']),
        ];

        expect(dedupeAgainstPreviousPass(previous, candidates)).toEqual([
            violation('meta-viewport', 'shell', ['#other']),
        ]);
    });

    it('should ignore the context field entirely when matching', () => {
        const previous = [violation('html-has-lang', 'shell:light', ['html'])];
        const candidates = [
            violation('html-has-lang', 'print-pdf:dark', ['html']),
        ];

        expect(dedupeAgainstPreviousPass(previous, candidates)).toEqual([]);
    });

    it('should return an empty array when there is nothing to dedupe against', () => {
        const candidates = [violation('color-contrast', 'shell', ['h1'])];

        expect(dedupeAgainstPreviousPass([], candidates)).toEqual(candidates);
    });
});
