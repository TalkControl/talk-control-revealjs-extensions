const DEFAULT_DIR = 'demo';

export type A11yTarget =
    | { type: 'url'; url: string }
    | { type: 'dir'; dir: string };

export interface A11yArgs {
    target: A11yTarget;
    strict: boolean;
    updateBaseline: boolean;
}

/**
 * Parse the talk-control-a11y CLI arguments into a plain options object.
 * Defaults to scanning the `demo` dir, in informative (non-strict) mode,
 * without touching the baseline. `--url` and `--dir` are mutually
 * exclusive; any parsing issue throws a human-readable error.
 */
export function parseArgs(argv: string[]): A11yArgs {
    let url: string | undefined;
    let dir: string | undefined;
    let strict = false;
    let updateBaseline = false;

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

    return { target, strict, updateBaseline };
}

function requireValue(argv: string[], index: number, flag: string): string {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
        throw new Error(`Missing value for ${flag}`);
    }
    return value;
}
