import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Baseline } from '../types';
import prettier from 'prettier';

/**
 * Read a baseline JSON file from disk. An absent file is treated as an
 * empty baseline (first run / not yet created).
 */
export function readBaseline(path: string): Baseline {
    if (!existsSync(path)) {
        return [];
    }
    return JSON.parse(readFileSync(path, 'utf-8')) as Baseline;
}

/**
 * Write a baseline JSON file to disk, sorted by fingerprint so that two
 * successive runs against an unchanged deck produce byte-identical output,
 * and formatted through this repo's own Prettier config so `--update-
 * baseline` never leaves the file failing `npm run prettier`.
 */
export async function writeBaseline(
    path: string,
    baseline: Baseline
): Promise<void> {
    const sorted = [...baseline].sort((a, b) =>
        a.fingerprint.localeCompare(b.fingerprint)
    );
    // prettier.format() does not auto-discover .prettierrc the way its CLI
    // does: resolve this repo's own config explicitly, so the written file
    // never fails `npm run prettier`.
    const resolvedConfig = await prettier.resolveConfig(path);
    const formatted = await prettier.format(JSON.stringify(sorted), {
        ...resolvedConfig,
        filepath: path,
    });
    writeFileSync(path, formatted, 'utf-8');
}
