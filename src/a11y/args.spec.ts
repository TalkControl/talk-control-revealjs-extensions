import { describe, expect, it } from 'vitest';
import { parseArgs } from './args';

describe('parseArgs', () => {
    it('should default to scanning the demo dir, non-strict, no baseline update', () => {
        const args = parseArgs([]);

        expect(args).toEqual({
            target: { type: 'dir', dir: 'demo' },
            strict: false,
            updateBaseline: false,
        });
    });

    it('should enable strict mode', () => {
        const args = parseArgs(['--strict']);

        expect(args.strict).toBe(true);
    });

    it('should enable baseline update', () => {
        const args = parseArgs(['--update-baseline']);

        expect(args.updateBaseline).toBe(true);
    });

    it('should accept --url', () => {
        const args = parseArgs(['--url', 'http://localhost:4242']);

        expect(args.target).toEqual({
            type: 'url',
            url: 'http://localhost:4242',
        });
    });

    it('should accept --dir', () => {
        const args = parseArgs(['--dir', './dist-demo']);

        expect(args.target).toEqual({ type: 'dir', dir: './dist-demo' });
    });

    it('should reject --url and --dir together with a readable error', () => {
        expect(() =>
            parseArgs(['--url', 'http://localhost:4242', '--dir', 'demo'])
        ).toThrow(/--url.*--dir|--dir.*--url/i);
    });

    it('should reject a flag missing its value', () => {
        expect(() => parseArgs(['--url'])).toThrow(/--url/);
    });

    it('should reject an unknown flag with a readable error', () => {
        expect(() => parseArgs(['--nope'])).toThrow(/--nope/);
    });
});
