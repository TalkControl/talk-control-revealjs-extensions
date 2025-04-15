/**
 * @vitest-environment jsdom
 */
import { TcThemeOptions, manageTheme } from './tc-theme';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _handle_parameter } from '../helper';

const HTML = `
<div class="reveal">
    <div class="slides">
    </div>
</div>
`;

// Mock helper
vi.mock('../helper', () => ({
    _handle_parameter: vi.fn(),
}));

describe('manageTheme', () => {
    let mockSlideElement: HTMLElement;

    beforeEach(async () => {
        document.body.innerHTML = HTML;

        mockSlideElement = document.body.querySelector('.slides')!;
    });

    it('Should call handle_parameter', () => {
        const options: TcThemeOptions = { defaultTheme: 'dark-theme' };
        vi.mocked(_handle_parameter).mockReturnValue('dark-theme');

        manageTheme(options);

        expect(_handle_parameter).toHaveBeenCalledWith(
            expect.any(URLSearchParams),
            'data-theme',
            mockSlideElement,
            'data-theme',
            'dark-theme'
        );
    });
    it('Should use default theme if passed', () => {
        const options: TcThemeOptions = { defaultTheme: 'dark-theme' };
        vi.mocked(_handle_parameter).mockReturnValue('dark-theme');

        const result = manageTheme(options);

        expect(result).toBe('dark-theme');
    });
    it('Should apply default theme if passed on slide element', () => {
        const options: TcThemeOptions = { defaultTheme: 'dark-theme' };
        vi.mocked(_handle_parameter).mockReturnValue('dark-theme');

        manageTheme(options);

        expect(mockSlideElement.getAttribute('data-theme')).toBe('dark-theme');
    });

    it('Should use empty string as theme if none is given', () => {
        const options: TcThemeOptions = {};
        vi.mocked(_handle_parameter).mockReturnValue('');

        const result = manageTheme(options);

        expect(result).toBe('');
    });

    it('Should use theme given by _handle_parameter on slide element', () => {
        vi.mocked(_handle_parameter).mockReturnValue('custom-theme');

        const result = manageTheme({});

        expect(result).toBe('custom-theme');
    });

    it('Should apply theme on body element', () => {
        vi.mocked(_handle_parameter).mockReturnValue('custom-theme');

        manageTheme({});

        expect(document.body.getAttribute('data-theme')).toBe('custom-theme');
    });
});
