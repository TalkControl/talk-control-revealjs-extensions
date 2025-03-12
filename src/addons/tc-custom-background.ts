export interface TcCustomBackgroundMap {
    [key: string]: string;
}

export interface TcCustomBackgroundOptions {
    basePath: string; // Base path to find files
    mapBackgrounds: (theme?: string) => TcCustomBackgroundMap;
}

/**
 * Interface to deal with custom backgrounds
 */
export interface TcCustomBackgroundOptionsInternal
    extends TcCustomBackgroundOptions {
    theme?: string; // technical option used by
}
export function customBackgrounds(
    options: TcCustomBackgroundOptionsInternal
): void {
    const { basePath, mapBackgrounds, theme } = options;

    const basePathToUse = _cleanBasePath(basePath);

    const mapBackgroundsToUse = mapBackgrounds(theme);

    for (const key in mapBackgroundsToUse) {
        const queryElementList = document.querySelectorAll(
            '.reveal .slides section:not([data-background]).' + key
        );

        for (let i = 0; i < queryElementList.length; i++) {
            const element = queryElementList[i];
            element.classList.add('tc-specific-slide');
            element.setAttribute(
                'data-background',
                _cleanBgImg(basePathToUse, mapBackgrounds(theme)[key])
            );
        }
    }
}

function _cleanBgImg(basePath: string, value: string): string {
    const regexPathWithExt = /.*\.[a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9]/g;
    if (!regexPathWithExt.test(value)) {
        return value;
    }
    if (value && value.length > 0 && value[0] === '/') {
        return `${basePath}${value.substring(1)}`;
    }
    return `${basePath}${value}`;
}

function _cleanBasePath(basePath: string): string {
    if (!basePath || basePath.length === 0) {
        return './';
    }
    if (basePath[basePath.length - 1] !== '/') {
        return basePath + '/';
    }
    return basePath;
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              _cleanBasePath,
              _cleanBgImg,
          }
        : undefined;
