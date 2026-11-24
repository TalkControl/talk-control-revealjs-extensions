/**
 * @vitest-environment jsdom
 */
import {
    type Mock,
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { _internals, featherIconPack } from './feather-icons-pack';
import { loadVendorScript } from '../utils/tc-vendor-loader';

vi.mock('../utils/tc-vendor-loader', () => ({
    loadVendorScript: vi.fn(),
}));

type WindowWithFeather = { feather?: { replace: () => void } };

describe(featherIconPack.name, () => {
    let replace: Mock<() => void>;

    beforeEach(() => {
        _internals!.resetFeatherCache();
        replace = vi.fn();
        vi.mocked(loadVendorScript).mockReset();
        // Simulates the vendored script executing and defining the global.
        vi.mocked(loadVendorScript).mockImplementation(async () => {
            (window as unknown as WindowWithFeather).feather = { replace };
        });
        delete (window as unknown as WindowWithFeather).feather;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create an icon pack', () => {
        expect(featherIconPack()).toBeDefined();
    });

    it('should have keyword as feather', () => {
        expect(featherIconPack().keyword).toBe('feather');
    });

    it('should have correct copy keyword', () => {
        expect(featherIconPack().copyKeyword).toBe('copy');
    });

    it('should not include keyword', () => {
        expect(featherIconPack().includesKeyword).not.toBeDefined();
    });

    it('should have html attribute as data-feather', () => {
        expect(featherIconPack().htmlAttribute).toBe('data-feather');
    });

    it('should not include icon in tag', () => {
        expect(featherIconPack().iconInTag).not.toBeDefined();
    });

    it('should have initFunction and ensureLoaded functions', () => {
        const options = featherIconPack();
        expect(typeof options.initFunction).toBe('function');
        expect(typeof options.ensureLoaded).toBe('function');
    });

    it('should not load anything until ensureLoaded is called', () => {
        featherIconPack();
        expect(loadVendorScript).not.toHaveBeenCalled();
    });

    it('should not call feather.replace before ensureLoaded has resolved', () => {
        // `initFunction` is called repeatedly and synchronously by the
        // markdown plugin and the copy-clipboard addon: it must be a safe
        // no-op while the vendored script isn't loaded yet.
        featherIconPack().initFunction!();
        expect(replace).not.toHaveBeenCalled();
    });

    it('should load the vendored Feather script and call feather.replace afterwards', async () => {
        const options = featherIconPack();

        await options.ensureLoaded!();
        options.initFunction!();

        expect(loadVendorScript).toHaveBeenCalledWith(
            'icons/feather/dist/feather.min.js'
        );
        expect(replace).toHaveBeenCalledTimes(1);
    });

    it('should only load the script once across concurrent ensureLoaded calls and packs', async () => {
        const first = featherIconPack();
        const second = featherIconPack();

        await Promise.all([first.ensureLoaded!(), second.ensureLoaded!()]);

        expect(loadVendorScript).toHaveBeenCalledTimes(1);
    });

    it('should never reject ensureLoaded, even if the script fails to load', async () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.mocked(loadVendorScript).mockRejectedValue(new Error('404'));
        const options = featherIconPack();

        await expect(options.ensureLoaded!()).resolves.toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Feather'),
            expect.any(Error)
        );

        options.initFunction!();
        expect(replace).not.toHaveBeenCalled();
    });

    it('should not reject if the script loads but exposes no window.feather', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(loadVendorScript).mockResolvedValue(undefined);

        await expect(
            featherIconPack().ensureLoaded!()
        ).resolves.toBeUndefined();
    });
});
