interface Rgb {
    r: number;
    g: number;
    b: number;
}

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_COLOR_PATTERN =
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i;

/**
 * Parses a CSS color (`#rgb`, `#rrggbb` or `rgb()`/`rgba()`) into its RGB
 * components. This is intentionally minimal: it only needs to support the
 * color formats Sass emits for literal hex colors (used by the admonition
 * theme).
 */
export function parseColor(color: string): Rgb {
    const hexMatch = HEX_COLOR_PATTERN.exec(color.trim());
    if (hexMatch) {
        const hex = hexMatch[1];
        const expanded =
            hex.length === 3
                ? hex
                      .split('')
                      .map((char) => char + char)
                      .join('')
                : hex;
        return {
            r: parseInt(expanded.slice(0, 2), 16),
            g: parseInt(expanded.slice(2, 4), 16),
            b: parseInt(expanded.slice(4, 6), 16),
        };
    }

    const rgbMatch = RGB_COLOR_PATTERN.exec(color.trim());
    if (rgbMatch) {
        return {
            r: Number(rgbMatch[1]),
            g: Number(rgbMatch[2]),
            b: Number(rgbMatch[3]),
        };
    }

    throw new Error(`Unsupported color format: "${color}"`);
}

function channelToLinear(channel: number): number {
    const normalized = channel / 255;
    return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * WCAG relative luminance of a color.
 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */
export function relativeLuminance(color: string): number {
    const { r, g, b } = parseColor(color);
    return (
        0.2126 * channelToLinear(r) +
        0.7152 * channelToLinear(g) +
        0.0722 * channelToLinear(b)
    );
}

/**
 * WCAG contrast ratio between two colors, in the `[1, 21]` range.
 * @see https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */
export function contrastRatio(foreground: string, background: string): number {
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
}
