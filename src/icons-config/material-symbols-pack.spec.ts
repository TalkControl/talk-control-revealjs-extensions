import { describe, expect, it } from 'vitest';
import { materialSymbolsIconPack } from './material-symbols-pack';

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
});
