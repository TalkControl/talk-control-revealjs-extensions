/**
 * @vitest-environment jsdom
 */
import * as helper from "../helper";
import { _internals, i18n } from './tc-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlidePath } from "../models";

const baseMarkdownPath = '/markdown/';
const slidePath1 = { path: 'slide1.EN.md' };
const slidePath2 = { path: 'slide1.md' };

describe('firstExisting', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        global.fetch = vi.fn();
    });

    it('should return valid path', async () => {

        vi.mocked(fetch).mockImplementationOnce(() =>
            Promise.resolve(new Response(null, { status: 200 }))
        );

        const result = await _internals!.firstExisting(
            baseMarkdownPath,
            slidePath1,
            slidePath2
        );

        expect(result).toEqual(slidePath1);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
            '/markdown/slide1.EN.md',
            expect.objectContaining({ method: 'HEAD' })
        );
    });

    it('should return second path if first does not exist', async () => {

        vi.mocked(fetch)
            .mockImplementationOnce(() =>
                Promise.resolve(new Response(null, { status: 404 }))
            )
            .mockImplementationOnce(() =>
                Promise.resolve(new Response(null, { status: 200 }))
            );

        const result = await _internals!.firstExisting(
            baseMarkdownPath,
            slidePath1,
            slidePath2
        );

        expect(result).toEqual(slidePath2);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            '/markdown/slide1.EN.md',
            expect.objectContaining({ method: 'HEAD' })
        );
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            '/markdown/slide1.md',
            expect.objectContaining({ method: 'HEAD' })
        );
    });

    it('should return null if no path', async () => {

        vi.mocked(fetch).mockImplementation(() =>
            Promise.resolve(new Response(null, { status: 404 }))
        );

        const result = await _internals!.firstExisting(
            baseMarkdownPath,
            slidePath1,
            slidePath2
        );

        expect(result).toBeNull();
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should deal with fetch errors', async () => {

        vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

        const result = await _internals!.firstExisting(
            baseMarkdownPath,
            slidePath1
        );

        expect(result).toBeNull();
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});


describe('i18n', () => {
    const mockHandleParameter = vi.fn();
    const baseMarkdownPath = '/markdown/';

    beforeEach(() => {
        vi.resetAllMocks();

        vi.spyOn(helper, '_handle_parameter').mockImplementation(mockHandleParameter);
        global.fetch = vi.fn();
    });

    it('should return originals slides if using default language', async () => {
        const slides: SlidePath[] = [
            { path: 'slide1.md' },
            { path: 'slide2.md' }
        ];
        // Ask lang
        mockHandleParameter.mockReturnValue('EN');

        const result = await i18n(slides, baseMarkdownPath); //Use default language (EN)

        expect(result).toEqual(slides);
        expect(mockHandleParameter).toHaveBeenCalledWith(
            expect.any(URLSearchParams),
            'data-lang',
            expect.any(Object),
            'data-lang',
            'EN'
        );
    });

    it('sould search translate version if not the same language', async () => {
        const slides: SlidePath[] = [
            { path: 'slide1.md' },
            { path: 'slide2.md' }
        ];
        // Ask language
        mockHandleParameter.mockReturnValue('FR');

        // Considering that all files are present
        vi.mocked(fetch).mockImplementation(() =>
            Promise.resolve(new Response(null, { status: 200 }))
        )

        const result = await i18n(slides, baseMarkdownPath, 'EN');

        expect(result).toEqual([
            { path: 'slide1.FR.md' },
            { path: 'slide2.FR.md' }
        ]);
    });

    it('sould deal with non present translation', async () => {
        const slides: SlidePath[] = [
            { path: 'slide1.md' },
            { path: 'slide2.md' }
        ];
        // Ask language
        mockHandleParameter.mockReturnValue('FR');

        // First traduction file present, second is not present but file is present
        vi.mocked(fetch).mockImplementationOnce(() =>
            Promise.resolve(new Response(null, { status: 200 }))
        ).mockImplementationOnce(() =>
            Promise.resolve(new Response(null, { status: 400 }))
        ).mockImplementationOnce(() =>
            Promise.resolve(new Response(null, { status: 200 }))
        );

        const result = await i18n(slides, baseMarkdownPath, 'EN');

        expect(result).toEqual([
            { path: 'slide1.FR.md' },
            { path: 'slide2.md' }
        ]);
    });

    it('should deal with non present files ', async () => {
        const slides: SlidePath[] = [
            { path: 'slide1.md' },
            { path: 'slide2.md' }
        ];
        // Ask language
        mockHandleParameter.mockReturnValue('FR');

        // First traduction = present, then no file present
        vi.mocked(fetch).mockImplementationOnce(() =>
            Promise.resolve(new Response(null, { status: 200 }))
        ).mockImplementationOnce(() =>
            Promise.resolve(new Response(null, { status: 400 }))
        ).mockImplementationOnce(() =>
            Promise.resolve(new Response(null, { status: 400 }))
        );

        const result = await i18n(slides, baseMarkdownPath, 'EN');

        expect(result).toEqual([
            { path: 'slide1.FR.md' }
        ]);
    });


    it('should deal emptu array', async () => {
        const slides: SlidePath[] = [];
        mockHandleParameter.mockReturnValue('EN');

        const result = await i18n(slides, baseMarkdownPath, 'EN');

        expect(result).toEqual([]);
    });

    it('should respect initial order', async () => {
        const slides: SlidePath[] = [
            { path: 'slide1.md' },
            { path: 'slide2.md' },
            { path: 'slide3.md' }
        ];
        mockHandleParameter.mockReturnValue('EN');

        const result = await i18n(slides, baseMarkdownPath, 'EN');

        expect(result).toEqual([
            { path: 'slide1.md' },
            { path: 'slide2.md' },
            { path: 'slide3.md' }
        ]);
    });
});
