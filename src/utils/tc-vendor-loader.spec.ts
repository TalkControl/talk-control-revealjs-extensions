/**
 * @vitest-environment jsdom
 */
import {
    TcVendorLoadError,
    _internals,
    loadVendorModule,
    loadVendorStylesheet,
    resolveVendorUrl,
    waitForFonts,
} from './tc-vendor-loader';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
    _internals!.resetCache();
    document.head.innerHTML = '';
});

describe(resolveVendorUrl.name, () => {
    afterEach(() => {
        _internals!.resetCache();
    });

    it('resolves against the default vendor base URL', () => {
        const url = resolveVendorUrl('fonts/x/a.css');

        expect(url.pathname.endsWith('/vendor/fonts/x/a.css')).toBe(true);
    });

    it('throws for a path containing a ".." segment', () => {
        expect(() => resolveVendorUrl('../secrets.css')).toThrow();
        expect(() => resolveVendorUrl('fonts/../../a.css')).toThrow();
    });

    it('throws for a root-relative path', () => {
        expect(() => resolveVendorUrl('/etc/passwd')).toThrow();
    });

    it('throws for an absolute URL', () => {
        expect(() =>
            resolveVendorUrl('https://evil.example.com/a.css')
        ).toThrow();
    });
});

describe(loadVendorStylesheet.name, () => {
    it('injects a single <link rel="stylesheet"> for two concurrent calls on the same URL', () => {
        const first = loadVendorStylesheet('fonts/x/a.css');
        const second = loadVendorStylesheet('fonts/x/a.css');

        expect(first).toBe(second);
        expect(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).toHaveLength(1);
    });

    it('resolves once the injected <link> fires "load"', async () => {
        const promise = loadVendorStylesheet('fonts/x/a.css');
        const link = document.querySelector('link[rel="stylesheet"]')!;

        link.dispatchEvent(new Event('load'));

        await expect(promise).resolves.toBeUndefined();
    });

    it('rejects with a TcVendorLoadError naming the URL when the <link> fires "error"', async () => {
        const promise = loadVendorStylesheet('fonts/x/a.css');
        const link = document.querySelector('link[rel="stylesheet"]')!;

        link.dispatchEvent(new Event('error'));

        await expect(promise).rejects.toThrow(TcVendorLoadError);
        await promise.catch((error: TcVendorLoadError) => {
            expect(error.kind).toBe('stylesheet');
            expect(error.message).toContain(error.url);
        });
    });

    it('does not re-inject if a stylesheet with the same resolved URL already exists in the DOM', () => {
        const existing = document.createElement('link');
        existing.rel = 'stylesheet';
        existing.href = resolveVendorUrl('fonts/x/a.css').href;
        document.head.appendChild(existing);

        void loadVendorStylesheet('fonts/x/a.css');

        expect(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).toHaveLength(1);
    });

    it('resolves immediately when a stylesheet already present in the DOM is reused', async () => {
        const existing = document.createElement('link');
        existing.rel = 'stylesheet';
        existing.href = resolveVendorUrl('fonts/x/a.css').href;
        document.head.appendChild(existing);

        await expect(
            loadVendorStylesheet('fonts/x/a.css')
        ).resolves.toBeUndefined();
    });

    it('allows a retry after a failed load (cache entry removed, failed <link> removed from the DOM)', async () => {
        const failed = loadVendorStylesheet('fonts/x/a.css');
        document
            .querySelector('link[rel="stylesheet"]')!
            .dispatchEvent(new Event('error'));
        await expect(failed).rejects.toThrow(TcVendorLoadError);
        // The failed <link> must be removed: otherwise the retry's
        // alreadyPresent() check would find it and resolve immediately.
        expect(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).toHaveLength(0);

        const retry = loadVendorStylesheet('fonts/x/a.css');

        expect(retry).not.toBe(failed);
        expect(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).toHaveLength(1);
    });
});

describe(loadVendorModule.name, () => {
    afterEach(() => {
        _internals!.resetCache();
    });

    it('calls the importer once for two concurrent calls and returns its module', async () => {
        const fakeModule = { mermaid: 'esm' };
        const importer = vi.fn().mockResolvedValue(fakeModule);
        _internals!.setImporter(importer);

        const [first, second] = await Promise.all([
            loadVendorModule('mermaid/mermaid.esm.min.mjs'),
            loadVendorModule('mermaid/mermaid.esm.min.mjs'),
        ]);

        expect(importer).toHaveBeenCalledTimes(1);
        expect(first).toBe(fakeModule);
        expect(second).toBe(fakeModule);
    });

    it('wraps an importer rejection in a TcVendorLoadError and clears the cache', async () => {
        const importer = vi.fn().mockRejectedValue(new Error('network down'));
        _internals!.setImporter(importer);

        await expect(
            loadVendorModule('mermaid/mermaid.esm.min.mjs')
        ).rejects.toThrow(TcVendorLoadError);

        // Retry is possible: the importer is called again (cache was cleared).
        importer.mockResolvedValue({ ok: true });
        await expect(
            loadVendorModule('mermaid/mermaid.esm.min.mjs')
        ).resolves.toEqual({ ok: true });
        expect(importer).toHaveBeenCalledTimes(2);
    });
});

describe(waitForFonts.name, () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('resolves once document.fonts.load resolves for every spec', async () => {
        const load = vi.fn().mockResolvedValue([]);
        vi.stubGlobal('document', {
            ...document,
            fonts: { load },
        });

        await expect(
            waitForFonts(['1em "Font Awesome 6 Free"', '1em "Feather"'])
        ).resolves.toBeUndefined();

        expect(load).toHaveBeenCalledTimes(2);
    });

    it('resolves on timeout even if document.fonts.load never settles', async () => {
        vi.useFakeTimers();
        const load = vi.fn().mockImplementation(() => new Promise(() => {}));
        vi.stubGlobal('document', {
            ...document,
            fonts: { load },
        });

        const promise = waitForFonts(['1em "Font Awesome 6 Free"'], 50);
        await vi.advanceTimersByTimeAsync(50);

        await expect(promise).resolves.toBeUndefined();
    });

    it('never rejects, even if document.fonts.load rejects', async () => {
        const load = vi.fn().mockRejectedValue(new Error('nope'));
        vi.stubGlobal('document', {
            ...document,
            fonts: { load },
        });

        await expect(
            waitForFonts(['1em "Font Awesome 6 Free"'])
        ).resolves.toBeUndefined();
    });
});
