import { describe, expect, it } from 'vitest';
import { A11yViolation } from './types';
import { computeFingerprint } from './fingerprint';

function violation(overrides: Partial<A11yViolation> = {}): A11yViolation {
    return {
        id: 'color-contrast',
        context: 'slide-1',
        nodes: [{ target: ['section', 'p'] }],
        ...overrides,
    };
}

describe('computeFingerprint', () => {
    it('should return the same fingerprint for the same violation', () => {
        const a = violation();
        const b = violation();

        expect(computeFingerprint(a)).toEqual(computeFingerprint(b));
    });

    it('should be indifferent to the order of the nodes', () => {
        const a = violation({
            nodes: [
                { target: ['section', 'p'] },
                { target: ['section', 'h1'] },
            ],
        });
        const b = violation({
            nodes: [
                { target: ['section', 'h1'] },
                { target: ['section', 'p'] },
            ],
        });

        expect(computeFingerprint(a)).toEqual(computeFingerprint(b));
    });

    it('should change when the slide (context) changes', () => {
        const a = violation({ context: 'slide-1' });
        const b = violation({ context: 'slide-2' });

        expect(computeFingerprint(a)).not.toEqual(computeFingerprint(b));
    });

    it('should change when the rule id changes', () => {
        const a = violation({ id: 'color-contrast' });
        const b = violation({ id: 'image-alt' });

        expect(computeFingerprint(a)).not.toEqual(computeFingerprint(b));
    });

    it('should change when the selector changes', () => {
        const a = violation({ nodes: [{ target: ['section', 'p'] }] });
        const b = violation({ nodes: [{ target: ['section', 'h1'] }] });

        expect(computeFingerprint(a)).not.toEqual(computeFingerprint(b));
    });

    it('should change when the number of nodes changes', () => {
        const a = violation({ nodes: [{ target: ['section', 'p'] }] });
        const b = violation({
            nodes: [
                { target: ['section', 'p'] },
                { target: ['section', 'h1'] },
            ],
        });

        expect(computeFingerprint(a)).not.toEqual(computeFingerprint(b));
    });
});
