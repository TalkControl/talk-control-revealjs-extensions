import { describe, expect, it } from 'vitest';
import { fontAwesomeIconPack } from './font-awesome-pack';

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
});
