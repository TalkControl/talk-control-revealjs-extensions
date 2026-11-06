import { contrastRatio, parseColor, relativeLuminance } from './contrast.utils';
import { describe, expect, it } from 'vitest';

describe(contrastRatio.name, () => {
    it('returns 21 for black on white (maximum contrast)', () => {
        expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    });

    it('returns 21 for white on black (order independent)', () => {
        expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
    });

    it('returns 1 for identical colors', () => {
        expect(contrastRatio('#6093f8', '#6093f8')).toBeCloseTo(1, 5);
    });

    it('matches the known low ratio of the original admonition "success" color on white', () => {
        // #6ffa8e on #ffffff is the pre-fix "success" admonition color, documented
        // in issue #101 as ~1.33:1 (fails the 4.5:1 WCAG AA text threshold).
        expect(contrastRatio('#6ffa8e', '#ffffff')).toBeCloseTo(1.33, 1);
    });

    it('supports 3-digit hex colors', () => {
        expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1);
    });

    it('supports rgb()/rgba() colors', () => {
        expect(
            contrastRatio('rgb(0, 0, 0)', 'rgba(255, 255, 255, 1)')
        ).toBeCloseTo(21, 1);
    });

    it('throws on an unsupported color format', () => {
        expect(() => contrastRatio('not-a-color', '#ffffff')).toThrow(
            /Unsupported color format/
        );
    });
});

describe(relativeLuminance.name, () => {
    it('returns 1 for white', () => {
        expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    });

    it('returns 0 for black', () => {
        expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    });
});

describe(parseColor.name, () => {
    it('parses a 6-digit hex color', () => {
        expect(parseColor('#336699')).toEqual({ r: 0x33, g: 0x66, b: 0x99 });
    });

    it('parses a 3-digit hex color', () => {
        expect(parseColor('#369')).toEqual({ r: 0x33, g: 0x66, b: 0x99 });
    });

    it('parses an rgb() color', () => {
        expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 });
    });
});
