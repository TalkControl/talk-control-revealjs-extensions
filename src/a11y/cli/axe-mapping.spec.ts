import { describe, expect, it } from 'vitest';
import type { Result as AxeRawResult } from 'axe-core';
import { mapAxeResults } from './axe-mapping';

function rawResult(id: string, targets: AxeRawResult['nodes'][0]['target'][]) {
    return {
        id,
        description: '',
        help: '',
        helpUrl: '',
        tags: [],
        nodes: targets.map((target) => ({
            html: '',
            target,
            any: [],
            all: [],
            none: [],
        })),
    } as unknown as AxeRawResult;
}

describe('mapAxeResults', () => {
    it('should map a plain-selector raw result into an A11yViolation tagged with the context', () => {
        const raw = [rawResult('color-contrast', [['h1'], ['p']])];

        expect(mapAxeResults(raw, 'print-pdf:light')).toEqual([
            {
                id: 'color-contrast',
                context: 'print-pdf:light',
                nodes: [{ target: ['h1'] }, { target: ['p'] }],
            },
        ]);
    });

    it('should return an empty array for an empty raw result list', () => {
        expect(mapAxeResults([], 'shell:light')).toEqual([]);
    });

    it('should flatten a shadow-piercing target segment with a >>> separator', () => {
        const raw = [
            rawResult('aria-input-field-name', [
                [['tc-configurator-element', '#name-input']],
            ]),
        ];

        expect(mapAxeResults(raw, 'shell:light')).toEqual([
            {
                id: 'aria-input-field-name',
                context: 'shell:light',
                nodes: [
                    { target: ['tc-configurator-element >>> #name-input'] },
                ],
            },
        ]);
    });
});
