import { _internals, fontAwesomeIconPack } from './font-awesome-pack';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadVendorStylesheet, waitForFonts } from '../utils/tc-vendor-loader';

vi.mock('../utils/tc-vendor-loader', () => ({
    loadVendorStylesheet: vi.fn(),
    waitForFonts: vi.fn(),
}));

beforeEach(() => {
    _internals!.resetFontAwesomeCache();
    vi.mocked(loadVendorStylesheet).mockReset().mockResolvedValue(undefined);
    vi.mocked(waitForFonts).mockReset().mockResolvedValue(undefined);
});

describe(fontAwesomeIconPack.name, () => {
    it('should create an icon pack', () => {
        const markedIconsOptions = fontAwesomeIconPack();
        expect(markedIconsOptions).toBeDefined();
    });

    it('should have keyword as fa', () => {
        const markedIconsOptions = fontAwesomeIconPack();
        expect(markedIconsOptions.keyword).toBe('fa');
    });

    it('should include keyword', () => {
        const markedIconsOptions = fontAwesomeIconPack();
        expect(markedIconsOptions.includesKeyword).toBe(true);
    });

    it('should include correct copy icon keyword', () => {
        const markedIconsOptions = fontAwesomeIconPack();
        expect(markedIconsOptions.copyKeyword).toBe('fa-copy');
    });

    it('should have html attribute as class', () => {
        const markedIconsOptions = fontAwesomeIconPack();
        expect(markedIconsOptions.htmlAttribute).toBe('class');
    });

    it('should not include icon in tag', () => {
        const markedIconsOptions = fontAwesomeIconPack();
        expect(markedIconsOptions.iconInTag).not.toBeDefined();
    });

    it('should not have a function', () => {
        const markedIconsOptions = fontAwesomeIconPack();
        expect(markedIconsOptions.initFunction).not.toBeDefined();
    });

    it('should expose an ensureLoaded function and load nothing before it is called', () => {
        expect(typeof fontAwesomeIconPack().ensureLoaded).toBe('function');
        expect(loadVendorStylesheet).not.toHaveBeenCalled();
    });

    it('should load the vendored stylesheet then wait for the three font families', async () => {
        await fontAwesomeIconPack().ensureLoaded!();

        expect(loadVendorStylesheet).toHaveBeenCalledTimes(1);
        expect(loadVendorStylesheet).toHaveBeenCalledWith(
            'icons/font-awesome/css/all.min.css'
        );
        expect(waitForFonts).toHaveBeenCalledWith([
            '900 1em "Font Awesome 6 Free"',
            '400 1em "Font Awesome 6 Free"',
            '400 1em "Font Awesome 6 Brands"',
        ]);
    });

    it('should only load once across concurrent ensureLoaded calls and packs', async () => {
        await Promise.all([
            fontAwesomeIconPack().ensureLoaded!(),
            fontAwesomeIconPack().ensureLoaded!(),
        ]);
        expect(loadVendorStylesheet).toHaveBeenCalledTimes(1);
        expect(waitForFonts).toHaveBeenCalledTimes(1);
    });

    it('should never reject ensureLoaded, even if the stylesheet fails to load', async () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.mocked(loadVendorStylesheet).mockRejectedValue(new Error('404'));

        await expect(
            fontAwesomeIconPack().ensureLoaded!()
        ).resolves.toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Font Awesome'),
            expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
    });
});
