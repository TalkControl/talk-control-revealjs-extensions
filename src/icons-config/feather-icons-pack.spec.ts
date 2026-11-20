import { _internals, featherIconPack } from './feather-icons-pack';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import feather from 'feather-icons';

describe(featherIconPack.name, () => {
    beforeEach(() => {
        _internals!.resetFeatherCache();
    });

    it('should create an icon pack', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions).toBeDefined();
    });

    it('should have keyword as feather', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions.keyword).toBe('feather');
    });

    it('should have correct copy keyword', () => {
        const markedIconsOptions = featherIconPack();
        expect(markedIconsOptions.copyKeyword).toBe('copy');
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

    it('should expose an ensureLoaded function', () => {
        const markedIconsOptions = featherIconPack();
        expect(typeof markedIconsOptions.ensureLoaded).toBe('function');
    });

    it('should not call feather.replace before ensureLoaded has resolved', () => {
        const markedIconsOptions = featherIconPack();
        const replaceSpy = vi
            .spyOn(feather, 'replace')
            .mockImplementation(() => {});

        // `initFunction` is called repeatedly by the markdown plugin and the
        // copy-clipboard addon, synchronously, so it must be a safe no-op as
        // long as the lazy `feather-icons` module isn't loaded yet.
        markedIconsOptions.initFunction!();

        expect(replaceSpy).not.toHaveBeenCalled();
    });

    it('should call feather.replace once ensureLoaded has resolved', async () => {
        const markedIconsOptions = featherIconPack();
        const replaceSpy = vi
            .spyOn(feather, 'replace')
            .mockImplementation(() => {});

        await markedIconsOptions.ensureLoaded!();
        markedIconsOptions.initFunction!();

        expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should only load feather-icons once across concurrent ensureLoaded calls', async () => {
        const markedIconsOptions = featherIconPack();

        await Promise.all([
            markedIconsOptions.ensureLoaded!(),
            markedIconsOptions.ensureLoaded!(),
        ]);

        const replaceSpy = vi
            .spyOn(feather, 'replace')
            .mockImplementation(() => {});
        markedIconsOptions.initFunction!();

        expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should never reject ensureLoaded, even if loading feather-icons fails', async () => {
        const markedIconsOptions = featherIconPack();
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        // Simulate a load failure without mocking the module itself: a
        // broken cache entry (a rejected promise) is what `ensureLoaded`
        // must tolerate, whatever the underlying cause.
        _internals!.setFeatherModulePromise(
            Promise.reject(new Error('network down'))
        );

        await expect(
            markedIconsOptions.ensureLoaded!()
        ).resolves.toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('feather-icons'),
            expect.any(Error)
        );

        // Icons are simply not rendered - initFunction stays a safe no-op.
        const replaceSpy = vi
            .spyOn(feather, 'replace')
            .mockImplementation(() => {});
        markedIconsOptions.initFunction!();
        expect(replaceSpy).not.toHaveBeenCalled();
    });
});
