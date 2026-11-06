import { A11yViolation, BaselineEntry } from './types';
import { describe, expect, it } from 'vitest';
import { diffAgainstBaseline, toBaselineEntry } from './baseline';

function violation(overrides: Partial<A11yViolation> = {}): A11yViolation {
    return {
        id: 'color-contrast',
        context: 'slide-1',
        nodes: [{ target: ['section', 'p'] }],
        ...overrides,
    };
}

describe('toBaselineEntry', () => {
    it('should build a baseline entry from a violation', () => {
        const entry = toBaselineEntry(violation());

        expect(entry).toEqual({
            fingerprint: expect.any(String),
            ruleId: 'color-contrast',
            context: 'slide-1',
            selectors: ['section > p'],
        });
    });
});

describe('diffAgainstBaseline', () => {
    it('should report an unknown violation as new', () => {
        const current = [violation()];
        const baseline: BaselineEntry[] = [];

        const diff = diffAgainstBaseline(current, baseline);

        expect(diff.newViolations).toHaveLength(1);
        expect(diff.resolvedViolations).toHaveLength(0);
        expect(diff.knownViolations).toHaveLength(0);
    });

    it('should report a violation present in both as known', () => {
        const current = [violation()];
        const baseline: BaselineEntry[] = [toBaselineEntry(violation())];

        const diff = diffAgainstBaseline(current, baseline);

        expect(diff.newViolations).toHaveLength(0);
        expect(diff.resolvedViolations).toHaveLength(0);
        expect(diff.knownViolations).toHaveLength(1);
    });

    it('should report a baseline-only violation as resolved', () => {
        const current: A11yViolation[] = [];
        const baseline: BaselineEntry[] = [toBaselineEntry(violation())];

        const diff = diffAgainstBaseline(current, baseline);

        expect(diff.newViolations).toHaveLength(0);
        expect(diff.resolvedViolations).toHaveLength(1);
        expect(diff.knownViolations).toHaveLength(0);
    });

    it('should split a mix of new, known and resolved violations', () => {
        const known = violation({ context: 'slide-1' });
        const resolved = violation({ context: 'slide-2' });
        const newOne = violation({ context: 'slide-3' });

        const current = [known, newOne];
        const baseline = [toBaselineEntry(known), toBaselineEntry(resolved)];

        const diff = diffAgainstBaseline(current, baseline);

        expect(diff.newViolations.map((v) => v.context)).toEqual(['slide-3']);
        expect(diff.resolvedViolations.map((v) => v.context)).toEqual([
            'slide-2',
        ]);
        expect(diff.knownViolations.map((v) => v.context)).toEqual(['slide-1']);
    });
});
