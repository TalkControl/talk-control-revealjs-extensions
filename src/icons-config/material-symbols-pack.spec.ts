import { _internals, materialSymbolsIconPack } from './material-symbols-pack';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadVendorStylesheet, waitForFonts } from '../utils/tc-vendor-loader';

vi.mock('../utils/tc-vendor-loader', () => ({
    loadVendorStylesheet: vi.fn(),
    waitForFonts: vi.fn(),
}));

beforeEach(() => {
    _internals!.resetMaterialSymbolsCache();
    vi.mocked(loadVendorStylesheet).mockReset().mockResolvedValue(undefined);
    vi.mocked(waitForFonts).mockReset().mockResolvedValue(undefined);
});

describe(materialSymbolsIconPack.name, () => {
    it('should create an icon pack', () => {
        const markedIconsOptions = materialSymbolsIconPack();
        expect(markedIconsOptions).toBeDefined();
    });

    it('should have keyword as material-symbols', () => {
        const markedIconsOptions = materialSymbolsIconPack();
        expect(markedIconsOptions.keyword).toBe('material-symbols');
    });

    it('should not include keyword', () => {
        const markedIconsOptions = materialSymbolsIconPack();
        expect(markedIconsOptions.includesKeyword).not.toBeDefined;
    });
    it('should include correct copy keyword', () => {
        const markedIconsOptions = materialSymbolsIconPack();
        expect(markedIconsOptions.copyKeyword).toBe('content_copy');
    });

    it('should have html attribute as class', () => {
        const markedIconsOptions = materialSymbolsIconPack();
        expect(markedIconsOptions.htmlAttribute).toBe('class');
    });

    it('should include icon in tag', () => {
        const markedIconsOptions = materialSymbolsIconPack();
        expect(markedIconsOptions.iconInTag).toBe(true);
    });

    it('should not have a function', () => {
        const markedIconsOptions = materialSymbolsIconPack();
        expect(markedIconsOptions.initFunction).not.toBeDefined();
    });

    it('should expose an ensureLoaded function and load nothing before it is called', () => {
        expect(typeof materialSymbolsIconPack().ensureLoaded).toBe('function');
        expect(loadVendorStylesheet).not.toHaveBeenCalled();
    });

    it('should load the three vendored stylesheets then wait for the fonts', async () => {
        await materialSymbolsIconPack().ensureLoaded!();

        expect(loadVendorStylesheet).toHaveBeenCalledTimes(3);
        for (const file of ['outlined', 'rounded', 'sharp']) {
            expect(loadVendorStylesheet).toHaveBeenCalledWith(
                `icons/material-symbols/${file}.css`
            );
        }
        expect(waitForFonts).toHaveBeenCalledWith([
            '1em "Material Symbols Outlined"',
            '1em "Material Symbols Rounded"',
            '1em "Material Symbols Sharp"',
        ]);
    });

    it('should only load once across concurrent ensureLoaded calls and packs', async () => {
        await Promise.all([
            materialSymbolsIconPack().ensureLoaded!(),
            materialSymbolsIconPack().ensureLoaded!(),
        ]);
        expect(loadVendorStylesheet).toHaveBeenCalledTimes(3);
        expect(waitForFonts).toHaveBeenCalledTimes(1);
    });

    it('should never reject ensureLoaded, even if a stylesheet fails to load', async () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.mocked(loadVendorStylesheet).mockRejectedValue(new Error('404'));

        await expect(
            materialSymbolsIconPack().ensureLoaded!()
        ).resolves.toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Material Symbols'),
            expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
    });
});
