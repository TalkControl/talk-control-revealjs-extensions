/**
 * Contract of the published package (`dist/`), checked AFTER `npm run build`.
 *
 * These are characterization tests: they freeze what we ship today
 * (reveal.js 5.1.0) so that every later upgrade shows its impact as a
 * reviewable snapshot diff.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import {
    extractRootCustomProperties,
    normalizeCss,
    normalizeCssValue,
} from './normalize';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = path.join(ROOT, 'dist');
const BIN = path.join(ROOT, 'node_modules', '.bin');

// File names are a contract: sfeir-school-theme imports the CSS by path.
const ESM_FILE = 'talk-control-revealjs-extensions.js';
const CSS_FILE = 'talk-control-revealjs-theme.css';
const DTS_FILE = 'talk-control-revealjs-extensions.d.ts';

// Size budget: a warning, not a failure (CSS is mostly base64 fonts).
const SIZE_BUDGET: Record<string, number> = {
    [ESM_FILE]: 3.5 * 1024 * 1024,
    [CSS_FILE]: 20 * 1024 * 1024,
};

/**
 * publint --strict problems that exist today and are tracked, not hidden.
 * Each entry is `<code> @ <path in package.json>`. Fixing one makes the test
 * fail until the entry is removed, so this list can only shrink.
 */
const PUBLINT_KNOWN_ISSUES = [
    // The UMD build has no `.d.cts`: `require` consumers get ESM types.
    // Known gap of the dual ESM + UMD build (see #91, lot 0).
    'EXPORTS_TYPES_INVALID_FORMAT @ exports > . > types',
    // scripts/utils/package-json.utils.ts writes a dist/package.json that
    // carries `exports` (ignored by Node in a nested package.json) and a
    // wrong `main`. Fixing it or dropping the file is a maintainer decision
    // (see #91, lot 0).
    'NESTED_PACKAGE_JSON_FIELD_IGNORED @ name',
];

function listFiles(dir: string, prefix = ''): string[] {
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) =>
            entry.isDirectory()
                ? listFiles(
                      path.join(dir, entry.name),
                      `${prefix}${entry.name}/`
                  )
                : [`${prefix}${entry.name}`]
        )
        .sort();
}

function run(command: string, args: string[], cwd = ROOT): string {
    try {
        return execFileSync(command, args, {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
        });
    } catch (error) {
        const { stdout, stderr } = error as {
            stdout?: string;
            stderr?: string;
        };
        throw new Error(
            `\`${path.basename(command)} ${args.join(' ')}\` failed:\n${stdout ?? ''}\n${stderr ?? ''}`
        );
    }
}

describe('dist/ contract', () => {
    let css: string;

    beforeAll(() => {
        if (!fs.existsSync(path.join(DIST, ESM_FILE))) {
            throw new Error(
                'dist/ is missing: run `npm run build` before `npm run test:contract`.'
            );
        }
        css = fs.readFileSync(path.join(DIST, CSS_FILE), 'utf8');
    });

    it('ships the expected files, with the exact CSS file name', () => {
        expect(listFiles(DIST)).toEqual([
            'images/quotes.webp',
            'package.json',
            DTS_FILE,
            ESM_FILE,
            `${ESM_FILE}.map`,
            'talk-control-revealjs-extensions.umd.cjs',
            'talk-control-revealjs-extensions.umd.cjs.map',
            CSS_FILE,
            'talk-control.png',
        ]);
    });

    it('matches the normalized CSS snapshot', async () => {
        await expect(normalizeCss(css)).toMatchFileSnapshot(
            './__snapshots__/theme.css'
        );
    });

    it('matches the :root custom properties snapshot', async () => {
        const properties = extractRootCustomProperties(css);
        await expect(
            JSON.stringify(properties, undefined, 4) + '\n'
        ).toMatchFileSnapshot('./__snapshots__/custom-properties.json');
    });

    // The most important test of the safety net: reveal.js 6 emits
    // `:root { --r-* }` with its own defaults when the TalkControl settings
    // are declared too late. Values are normalized (lowercase, `white` ≡
    // `#fff` ≡ `#ffffff`) to survive a minifier change.
    it('keeps the TalkControl values of the reveal.js custom properties', () => {
        const properties = extractRootCustomProperties(css);
        const value = (name: string) => {
            expect(
                properties,
                `${name} is not declared in :root`
            ).toHaveProperty(name);
            return normalizeCssValue(properties[name]);
        };
        expect(value('--r-main-color')).toBe('#1d1d1d');
        expect(value('--r-background-color')).toBe(normalizeCssValue('white'));
        expect(value('--r-link-color')).toBe('#a64d79');
        expect(value('--r-link-color-hover')).toBe('#cb8eac');
        expect(value('--r-main-font-size')).toBe('2.5em');
        expect(value('--r-heading-font')).toContain('league gothic');
    });

    it('matches the public API (.d.ts) snapshot', async () => {
        const dts = fs
            .readFileSync(path.join(DIST, DTS_FILE), 'utf8')
            .replace(/\r\n?/g, '\n');
        await expect(dts).toMatchFileSnapshot('./__snapshots__/api.d.ts');
    });

    it('stays within the size budget (warning only)', () => {
        for (const [file, budget] of Object.entries(SIZE_BUDGET)) {
            const size = fs.statSync(path.join(DIST, file)).size;
            if (size > budget) {
                console.warn(
                    `[size budget] dist/${file} is ${(size / 1024 / 1024).toFixed(2)} MB, budget is ${(budget / 1024 / 1024).toFixed(2)} MB`
                );
            }
            expect(size).toBeGreaterThan(0);
        }
    });

    it('passes publint --strict (except the documented known issues)', async () => {
        // Same as `publint --strict`, through the API so that the known
        // issues below can be listed explicitly. publint packs the package
        // itself, ignoring lifecycle scripts.
        const { publint } = await import('publint');
        const { formatMessage } = await import('publint/utils');
        const { messages, pkg } = await publint({ pkgDir: ROOT, strict: true });
        const problems = messages.filter(
            (message) => message.type !== 'suggestion'
        );
        const key = (code: string, at: string[]) =>
            `${code} @ ${at.join(' > ')}`;
        const found = problems.map((message) =>
            key(message.code, message.path)
        );
        const unexpected = problems
            .filter(
                (message) =>
                    !PUBLINT_KNOWN_ISSUES.includes(
                        key(message.code, message.path)
                    )
            )
            .map((message) => formatMessage(message, pkg) ?? message.code);
        expect(unexpected, 'new publint problems').toEqual([]);
        // A known issue that disappears must be removed from the list.
        expect(
            PUBLINT_KNOWN_ISSUES.filter((issue) => !found.includes(issue)),
            'fixed publint issues: remove them from PUBLINT_KNOWN_ISSUES'
        ).toEqual([]);
    });

    it('passes attw with the esm-only profile', () => {
        // Equivalent of `attw --pack . --profile esm-only`, but `--pack` runs
        // a plain `npm pack`, which triggers `prepare` (a full rebuild of
        // dist/ while the other contract tests read it). We pack the
        // existing dist/ ourselves with --ignore-scripts instead.
        // The UMD build has no `.d.cts`: known gap, hence `esm-only`. The
        // profile only ignores per-resolution problems; the same gap is also
        // reported as `FalseESM` (the `.d.ts` paired with `.umd.cjs`), a
        // file-level problem the profile cannot ignore, so we ignore that
        // single rule explicitly. It is the publint
        // EXPORTS_TYPES_INVALID_FORMAT known issue seen from attw.
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-attw-'));
        try {
            const packed = JSON.parse(
                run('npm', [
                    'pack',
                    '--ignore-scripts',
                    '--json',
                    '--pack-destination',
                    tmp,
                ])
            ) as Array<{ filename: string }>;
            const tarball = path.join(tmp, packed[0].filename);
            run(path.join(BIN, 'attw'), [
                tarball,
                '--profile',
                'esm-only',
                '--ignore-rules',
                'false-esm',
                // `./theme` is the CSS file: no JavaScript, no types to check.
                '--exclude-entrypoints',
                './theme',
            ]);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });
});
