/**
 * Contract of the reveal.js imports: reveal.js 6 only exposes the public
 * entries declared in its `exports` map (`reveal.js/plugin/<name>`,
 * `reveal.js/reveal.css`). The reveal.js 5 paths (`*.esm`,
 * `plugin/<name>/<name>`, `dist/`) must never come back.
 */
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function listFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? listFiles(full) : [full];
    });
}

const FORBIDDEN: Array<[string, RegExp]> = [
    ['a `.esm` module path', /\.esm['"]/],
    ['a reveal.js 5 `plugin/<name>/` path', /reveal\.js\/plugin\/[a-z]+\//],
    ['a reveal.js 5 `dist/` path', /reveal\.js\/dist\//],
];

describe('reveal.js import paths', () => {
    const files = listFiles(SRC).filter(
        (f) => !f.endsWith('.snap') && !/__snapshots__|__fixtures__/.test(f)
    );

    it.each(FORBIDDEN)('src/ contains no %s', (_label, pattern) => {
        const offenders = files.filter((f) =>
            pattern.test(fs.readFileSync(f, 'utf-8'))
        );
        expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
    });
});
