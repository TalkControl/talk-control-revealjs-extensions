import { describe, expect, it, vi } from 'vitest';
import feather from 'feather-icons';
import { featherIconPack } from './feather-icons-pack';



describe(featherIconPack.name, () => {


    it('should create an icon pack', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions).toBeDefined();
    });

    it('should have keyword as feather', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions.keyword).toBe("feather");
    });

    it('should not include keyword', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions.includesKeyword).not.toBeDefined();
    });

    it('should have html attribute as data-feather', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions.htmlAttribute).toBe('data-feather');
    });

    it('should not include icon in tag', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions.iconInTag).not.toBeDefined();
    });

    it('should have a function', () => {
        const markedIconsOptions = featherIconPack();
        expect(typeof markedIconsOptions.initFunction).toBe('function');
    });

    it('should call the right function', () => {
        const markedIconsOptions = featherIconPack();
        const replaceSpy = vi.spyOn(feather, 'replace');

        replaceSpy.mockImplementation(() => { });
        const getApplesSpy = vi.spyOn(feather, 'replace');
        markedIconsOptions.initFunction!();
        expect(getApplesSpy.mock.calls.length).toBe(1);
    });



});