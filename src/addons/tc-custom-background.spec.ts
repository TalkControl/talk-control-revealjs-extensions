/**
 * @vitest-environment jsdom
 */
import { _internals, customBackgrounds } from './tc-custom-background';
import { beforeEach, describe, expect, it } from 'vitest';

const HTML = `
<div class="reveal">
    <div class="slides">
        <section class="slide-1">
            Content
        </section>
        <section class="slide-2">
            Content
        </section>
        <section class="slide-3">
            Content
        </section>
    </div>
</div>
`;

describe('Custom Backgrounds', () => {
    // Test suite for _cleanBasePath internal function
    describe('_cleanBasePath', () => {
        const { _cleanBasePath } = _internals!;

        it('should return "./" when basePath is empty', () => {
            expect(_cleanBasePath('')).toBe('./');
        });

        it('should return "./" when basePath is undefined', () => {
            expect(_cleanBasePath(undefined as unknown as string)).toBe('./');
        });

        it('should add trailing slash if missing', () => {
            expect(_cleanBasePath('/path/to/folder')).toBe('/path/to/folder/');
        });

        it('should not add trailing slash if already present', () => {
            expect(_cleanBasePath('/path/to/folder/')).toBe('/path/to/folder/');
        });
    });

    describe('_cleanBgImg', () => {
        const { _cleanBgImg } = _internals!;

        it('should return path with extension', () => {
            expect(_cleanBgImg('./', 'path.jpg')).toBe('./path.jpg');
            expect(_cleanBgImg('./', 'path.mp4')).toBe('./path.mp4');
        });

        it('should return value if not matching extension', () => {
            expect(_cleanBgImg('./', 'value')).toBe('value');
        });

        it('should clean path to avoid double /', () => {
            expect(_cleanBgImg('./', '/path.jpg')).toBe('./path.jpg');
        });
    });

    // Test suite for customBackgrounds function
    describe('customBackgrounds', () => {
        beforeEach(() => {
            document.body.innerHTML = HTML;
        });

        it('should apply backgrounds to matching elements', () => {
            const options = {
                basePath: '/images',
                mapBackgrounds: () => {
                    return {
                        'slide-1': 'background1.jpg',
                        'slide-2': 'background2.jpg',
                    };
                },
            };

            customBackgrounds(options);

            const slide1Element = document.querySelector('.slide-1');
            const slide2Element = document.querySelector('.slide-2');
            expect(slide1Element?.getAttribute('data-background')).toBe(
                '/images/background1.jpg'
            );
            expect(slide2Element?.getAttribute('data-background')).toBe(
                '/images/background2.jpg'
            );
        });

        it('should not apply backgrounds to non matching elements', () => {
            const options = {
                basePath: '/images',
                mapBackgrounds: () => {
                    return {
                        'slide-1': 'background1.jpg',
                        'slide-2': 'background2.jpg',
                    };
                },
            };

            customBackgrounds(options);

            const slide3Element = document.querySelector('.slide-3');
            expect(slide3Element?.getAttribute('data-background')).toBeNull();
        });

        it('should apply backgrounds that are not img', () => {
            const options = {
                basePath: '/images',
                mapBackgrounds: () => {
                    return {
                        'slide-1': '#fff',
                        'slide-2': 'rgb(255,255,255)',
                        'slide-3': 'orange',
                    };
                },
            };

            customBackgrounds(options);

            const slide1Element = document.querySelector('.slide-1');
            const slide2Element = document.querySelector('.slide-2');
            const slide3Element = document.querySelector('.slide-3');
            expect(slide1Element?.getAttribute('data-background')).toBe('#fff');
            expect(slide2Element?.getAttribute('data-background')).toBe(
                'rgb(255,255,255)'
            );
            expect(slide3Element?.getAttribute('data-background')).toBe(
                'orange'
            );
        });

        it('should handle empty mapBackgrounds object', () => {
            const options = {
                basePath: '/images',
                mapBackgrounds: () => {
                    return {};
                },
            };

            customBackgrounds(options);

            const slide1Element = document.querySelector('.slide-1');
            const slide2Element = document.querySelector('.slide-2');
            const slide3Element = document.querySelector('.slide-3');
            expect(slide1Element?.getAttribute('data-background')).toBeNull();
            expect(slide2Element?.getAttribute('data-background')).toBeNull();
            expect(slide3Element?.getAttribute('data-background')).toBeNull();
        });

        it('should apply backgrounds to matching elements and correct theme', () => {
            const options = {
                basePath: '/images',
                theme: 'test',
                mapBackgrounds: (theme: string | undefined) => {
                    if (theme === 'test') {
                        return {
                            'slide-1': 'background1.jpg',
                            'slide-2': 'background2.jpg',
                        };
                    } else {
                        return {
                            'slide-1': 'background1-bis.jpg',
                            'slide-2': 'background2-bis.jpg',
                        };
                    }
                },
            };

            customBackgrounds(options);

            const slide1Element = document.querySelector('.slide-1');
            const slide2Element = document.querySelector('.slide-2');
            expect(slide1Element?.getAttribute('data-background')).toBe(
                '/images/background1.jpg'
            );
            expect(slide2Element?.getAttribute('data-background')).toBe(
                '/images/background2.jpg'
            );
        });
    });
});
