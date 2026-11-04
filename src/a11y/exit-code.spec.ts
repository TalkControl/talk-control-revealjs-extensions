import { describe, expect, it } from 'vitest';
import { computeExitCode } from './exit-code';

describe('computeExitCode', () => {
    it('should always return 0 in informative mode, even with new violations', () => {
        expect(computeExitCode(3, false)).toEqual(0);
    });

    it('should return 0 in strict mode when there are no new violations', () => {
        expect(computeExitCode(0, true)).toEqual(0);
    });

    it('should return 1 in strict mode when there is at least one new violation', () => {
        expect(computeExitCode(1, true)).toEqual(1);
    });
});
