/**
 * Contract of the Mermaid bundle vendored into `dist/vendor/mermaid/` (#92),
 * checked AFTER `npm run build`.
 *
 * Mermaid ships as plain files, loaded by URL on demand: the main bundles must
 * never inline it, and every relative import of the vendored files must
 * resolve to a file we ship.
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = path.join(ROOT, 'dist');
const MERMAID_DIR = path.join(DIST, 'vendor', 'mermaid');
const ENTRY = path.join(MERMAID_DIR, 'dist', 'mermaid.esm.min.mjs');
const CHUNKS_DIR = path.join(MERMAID_DIR, 'dist', 'chunks', 'mermaid.esm.min');

// Mermaid 12.3.0 ships 105 chunks for ~5.4 MB: a warning level, not a ceiling
// of principle. A big jump is a reason to look at what the new version adds.
const MAX_BYTES = 6 * 1024 * 1024;
const MAX_CHUNKS = 130;

function listFiles(dir: string): string[] {
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) =>
            entry.isDirectory()
                ? listFiles(path.join(dir, entry.name)).map(
                      (file) => `${entry.name}/${file}`
                  )
                : [entry.name]
        )
        .sort();
}

const vendoredFiles = (): string[] =>
    listFiles(MERMAID_DIR).filter((file) => /\.mjs$/.test(file));

/** Relative specifiers of static and dynamic imports/re-exports. */
function relativeImports(source: string): string[] {
    const specifiers = new Set<string>();
    const pattern = /(?:\bfrom|\bimport)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;
    for (const match of source.matchAll(pattern)) {
        specifiers.add(match[1]);
    }
    return [...specifiers];
}

describe('vendored Mermaid (dist/vendor/mermaid)', () => {
    it('ships the entry file, the chunks and the licenses', () => {
        expect(fs.existsSync(ENTRY)).toBe(true);
        expect(fs.readdirSync(CHUNKS_DIR).length).toBeGreaterThan(0);
        for (const license of [
            'LICENSE',
            'licenses/elkjs/LICENSE.md',
            'licenses/dompurify/LICENSE',
            'licenses/katex/LICENSE',
        ]) {
            expect(
                fs.existsSync(path.join(MERMAID_DIR, license)),
                license
            ).toBe(true);
        }
    });

    it('resolves every relative import to a file it ships', () => {
        const missing: string[] = [];
        for (const file of vendoredFiles()) {
            const absolute = path.join(MERMAID_DIR, file);
            for (const specifier of relativeImports(
                fs.readFileSync(absolute, 'utf8')
            )) {
                if (
                    !fs.existsSync(
                        path.resolve(path.dirname(absolute), specifier)
                    )
                ) {
                    missing.push(`${file} -> ${specifier}`);
                }
            }
        }
        expect(missing).toEqual([]);
    });

    it('does not ship source maps or type declarations', () => {
        expect(
            listFiles(MERMAID_DIR).filter((file) => /\.(map|d\.ts)$/.test(file))
        ).toEqual([]);
    });

    it('stays within its size budget', () => {
        const files = vendoredFiles();
        const bytes = files.reduce(
            (sum, file) => sum + fs.statSync(path.join(MERMAID_DIR, file)).size,
            0
        );
        expect(bytes).toBeLessThan(MAX_BYTES);
        expect(files.length).toBeLessThan(MAX_CHUNKS);
    });

    it('ships exactly the version pinned in package.json', () => {
        const pinned = JSON.parse(
            fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
        ).devDependencies.mermaid as string;
        const installed = JSON.parse(
            fs.readFileSync(
                path.join(ROOT, 'node_modules', 'mermaid', 'package.json'),
                'utf8'
            )
        ).version as string;
        expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
        expect(installed).toBe(pinned);
        expect(
            fs.readFileSync(
                path.join(DIST, 'vendor', 'THIRD-PARTY-LICENSES.txt'),
                'utf8'
            )
        ).toContain(`## mermaid@${pinned}`);
    });

    it('is never inlined in the main bundles', () => {
        for (const file of [
            'talk-control-revealjs-extensions.js',
            'talk-control-revealjs-extensions.umd.cjs',
        ]) {
            const content = fs.readFileSync(path.join(DIST, file), 'utf8');
            expect(content, file).not.toContain('mermaidAPI');
            expect(content, file).not.toContain('mermaid.esm.min');
        }
    });

    it('does not embed the video-typed data URIs that break some servers', () => {
        // A `data:video/mp2t` URI is how a bundler turns a `.ts` file it
        // took for an asset: it must never end up in the vendored files.
        for (const file of vendoredFiles()) {
            expect(
                fs.readFileSync(path.join(MERMAID_DIR, file), 'utf8'),
                file
            ).not.toContain('data:video/mp2t');
        }
    });

    it('is part of the published package', () => {
        const output = execFileSync(
            'npm',
            ['pack', '--dry-run', '--json', '--ignore-scripts'],
            { cwd: ROOT, encoding: 'utf8' }
        );
        const packed = (JSON.parse(output)[0].files as { path: string }[]).map(
            (file) => file.path
        );
        expect(packed).toContain(
            'dist/vendor/mermaid/dist/mermaid.esm.min.mjs'
        );
        expect(packed).toContain('dist/vendor/mermaid/LICENSE');
        expect(
            packed.filter((file) =>
                file.startsWith('dist/vendor/mermaid/dist/chunks/')
            ).length
        ).toBe(fs.readdirSync(CHUNKS_DIR).length);
    });
});
