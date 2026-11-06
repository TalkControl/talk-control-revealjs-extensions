import { ReportFormat } from './report';

const DEFAULT_DIR = 'demo';
const DEFAULT_BASELINE_FILE = 'a11y-baseline.json';
const DEFAULT_THEME: A11yTheme = 'light';
const DEFAULT_FORMAT: ReportFormat = 'console';

export type A11yTarget =
    | { type: 'url'; url: string }
    | { type: 'dir'; dir: string };

export type A11yTheme = 'light' | 'dark' | 'both';

export interface A11ySlideOverride {
    h: number;
    v?: number;
}

export interface A11yArgs {
    target: A11yTarget;
    strict: boolean;
    updateBaseline: boolean;
    theme: A11yTheme;
    baselineFile: string;
    format: ReportFormat;
    slide?: A11ySlideOverride;
}

const THEMES: A11yTheme[] = ['light', 'dark', 'both'];
const FORMATS: ReportFormat[] = ['console', 'json'];

/**
 * Parse the talk-control-a11y CLI arguments into a plain options object.
 * Defaults to scanning the `demo` dir, in informative (non-strict) mode,
 * light theme, console format, without touching the baseline. `--url` and
 * `--dir` are mutually exclusive; any parsing issue throws a
 * human-readable error.
 */
export function parseArgs(argv: string[]): A11yArgs {
    let url: string | undefined;
    let dir: string | undefined;
    let strict = false;
    let updateBaseline = false;
    let theme: A11yTheme = DEFAULT_THEME;
    let baselineFile = DEFAULT_BASELINE_FILE;
    let format: ReportFormat = DEFAULT_FORMAT;
    let slide: A11ySlideOverride | undefined;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        switch (arg) {
            case '--url':
                url = requireValue(argv, i, '--url');
                i++;
                break;
            case '--dir':
                dir = requireValue(argv, i, '--dir');
                i++;
                break;
            case '--strict':
                strict = true;
                break;
            case '--update-baseline':
                updateBaseline = true;
                break;
            case '--theme':
                theme = parseTheme(requireValue(argv, i, '--theme'));
                i++;
                break;
            case '--baseline':
                baselineFile = requireValue(argv, i, '--baseline');
                i++;
                break;
            case '--format':
                format = parseFormat(requireValue(argv, i, '--format'));
                i++;
                break;
            case '--slide':
                slide = parseSlide(requireValue(argv, i, '--slide'));
                i++;
                break;
            case '--help':
                // Handled by the CLI entry point before argument parsing;
                // accepted here too so it never falls through to the
                // "unknown argument" branch.
                break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (url !== undefined && dir !== undefined) {
        throw new Error(
            '--url and --dir are mutually exclusive, use only one of them'
        );
    }

    const target: A11yTarget =
        url !== undefined
            ? { type: 'url', url }
            : { type: 'dir', dir: dir ?? DEFAULT_DIR };

    return {
        target,
        strict,
        updateBaseline,
        theme,
        baselineFile,
        format,
        slide,
    };
}

function parseTheme(value: string): A11yTheme {
    if (!THEMES.includes(value as A11yTheme)) {
        throw new Error(
            `Invalid --theme value: ${value} (expected one of ${THEMES.join(', ')})`
        );
    }
    return value as A11yTheme;
}

function parseFormat(value: string): ReportFormat {
    if (!FORMATS.includes(value as ReportFormat)) {
        throw new Error(
            `Invalid --format value: ${value} (expected one of ${FORMATS.join(', ')})`
        );
    }
    return value as ReportFormat;
}

function parseSlide(value: string): A11ySlideOverride {
    const match = /^(\d+)(?:\/(\d+))?$/.exec(value);
    if (!match) {
        throw new Error(
            `Invalid --slide value: ${value} (expected "h" or "h/v", e.g. "2" or "2/1")`
        );
    }
    const [, h, v] = match;
    return v === undefined ? { h: Number(h) } : { h: Number(h), v: Number(v) };
}

function requireValue(argv: string[], index: number, flag: string): string {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
        throw new Error(`Missing value for ${flag}`);
    }
    return value;
}
