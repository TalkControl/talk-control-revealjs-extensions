import { A11yIncomplete, A11yReportData } from './types';
import { describe, expect, it } from 'vitest';
import { formatReport } from './report';

function reportData(overrides: Partial<A11yReportData> = {}): A11yReportData {
    return {
        newViolations: [],
        resolvedViolations: [],
        knownViolations: [],
        incomplete: [],
        ...overrides,
    };
}

describe('formatReport (console)', () => {
    it('should summarize counts', () => {
        const output = formatReport(
            reportData({
                newViolations: [
                    {
                        fingerprint: 'fp-1',
                        ruleId: 'color-contrast',
                        context: 'slide-1',
                        selectors: ['section > p'],
                    },
                ],
                knownViolations: [
                    {
                        fingerprint: 'fp-2',
                        ruleId: 'image-alt',
                        context: 'slide-2',
                        selectors: ['img'],
                    },
                ],
            }),
            'console'
        );

        expect(output).toContain('1 new');
        expect(output).toContain('0 resolved');
        expect(output).toContain('1 known');
        expect(output).toContain('color-contrast');
    });

    it('should separate incomplete checks from confirmed violations', () => {
        const incomplete: A11yIncomplete[] = [
            { id: 'color-contrast', context: 'slide-4', nodes: [] },
        ];

        const output = formatReport(reportData({ incomplete }), 'console');

        // an incomplete check must never be counted as a (new/known) violation
        expect(output).toContain('0 new');
        expect(output).toContain('1 incomplete');
    });
});

describe('formatReport (json)', () => {
    it('should produce a versioned, machine-readable schema', () => {
        const output = formatReport(
            reportData({
                newViolations: [
                    {
                        fingerprint: 'fp-1',
                        ruleId: 'color-contrast',
                        context: 'slide-1',
                        selectors: ['section > p'],
                    },
                ],
                incomplete: [
                    { id: 'color-contrast', context: 'slide-4', nodes: [] },
                ],
            }),
            'json'
        );

        const parsed = JSON.parse(output);

        expect(parsed.schemaVersion).toEqual(expect.any(Number));
        expect(parsed.summary).toEqual({
            new: 1,
            resolved: 0,
            known: 0,
            incomplete: 1,
        });
        expect(parsed.violations.new).toHaveLength(1);
        expect(parsed.incomplete).toHaveLength(1);
        // incomplete must never leak into the violations block
        expect(parsed.violations.incomplete).toBeUndefined();
    });
});
