import { describe, expect, it } from 'vitest';
import { parseArgs } from './args';

describe('parseArgs', () => {
    it('should default to scanning the demo dir, non-strict, no baseline update', () => {
        const args = parseArgs([]);

        expect(args).toEqual({
            target: { type: 'dir', dir: 'demo' },
            strict: false,
            updateBaseline: false,
            theme: 'light',
            baselineFile: 'a11y-baseline.json',
            format: 'console',
            slide: undefined,
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

    it('should accept --theme light|dark|both', () => {
        expect(parseArgs(['--theme', 'dark']).theme).toBe('dark');
        expect(parseArgs(['--theme', 'both']).theme).toBe('both');
        expect(parseArgs(['--theme', 'light']).theme).toBe('light');
    });

    it('should reject an invalid --theme value with a readable error', () => {
        expect(() => parseArgs(['--theme', 'blue'])).toThrow(/--theme|blue/);
    });

    it('should accept a custom --baseline file', () => {
        const args = parseArgs(['--baseline', 'custom-baseline.json']);

        expect(args.baselineFile).toBe('custom-baseline.json');
    });

    it('should accept --format console|json', () => {
        expect(parseArgs(['--format', 'json']).format).toBe('json');
        expect(parseArgs(['--format', 'console']).format).toBe('console');
    });

    it('should reject an invalid --format value with a readable error', () => {
        expect(() => parseArgs(['--format', 'xml'])).toThrow(/--format|xml/);
    });

    it('should accept --slide with horizontal and vertical index', () => {
        const args = parseArgs(['--slide', '2/1']);

        expect(args.slide).toEqual({ h: 2, v: 1 });
    });

    it('should accept --slide with only a horizontal index', () => {
        const args = parseArgs(['--slide', '3']);

        expect(args.slide).toEqual({ h: 3 });
    });

    it('should reject an invalid --slide value with a readable error', () => {
        expect(() => parseArgs(['--slide', 'nope'])).toThrow(/--slide|nope/);
    });

    it('should accept --help without throwing', () => {
        expect(() => parseArgs(['--help'])).not.toThrow();
    });
});
