import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { readBaseline, writeBaseline } from './baseline-io';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

describe('baseline-io', () => {
    let dir: string;

    beforeEach(async () => {
        dir = await mkdtemp(join(tmpdir(), 'tc-a11y-baseline-'));
    });

    afterEach(async () => {
        await rm(dir, { recursive: true, force: true });
    });

    it('should return an empty baseline when the file does not exist', () => {
        expect(readBaseline(join(dir, 'missing.json'))).toEqual([]);
    });

    it('should write then read back the same baseline', async () => {
        const path = join(dir, 'a11y-baseline.json');
        const baseline = [
            {
                fingerprint: 'b-fp',
                ruleId: 'color-contrast',
                context: 'print-pdf:light',
                selectors: ['h2'],
            },
            {
                fingerprint: 'a-fp',
                ruleId: 'meta-viewport',
                context: 'print-pdf:light',
                selectors: ['meta'],
            },
        ];

        await writeBaseline(path, baseline);

        expect(readBaseline(path)).toEqual([baseline[1], baseline[0]]);
    });

    it('should sort entries by fingerprint for deterministic output', async () => {
        const path = join(dir, 'a11y-baseline.json');
        await writeBaseline(path, [
            {
                fingerprint: 'z',
                ruleId: 'r',
                context: 'c',
                selectors: [],
            },
            { fingerprint: 'a', ruleId: 'r', context: 'c', selectors: [] },
        ]);

        const raw = readFileSync(path, 'utf-8');
        expect(raw.indexOf('"a"')).toBeLessThan(raw.indexOf('"z"'));
    });

    it("should write output that satisfies this repo's own Prettier config", async () => {
        const path = join(dir, 'a11y-baseline.json');
        await writeBaseline(path, [
            { fingerprint: 'a', ruleId: 'r', context: 'c', selectors: ['x'] },
        ]);

        const raw = readFileSync(path, 'utf-8');
        expect(raw).toContain('"selectors": ["x"]');
    });
});
