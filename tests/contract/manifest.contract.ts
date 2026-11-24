/**
 * Contract of `package.json`: dependency hygiene guards.
 *
 * - jsdom is a test-only tool, it must never be a runtime dependency.
 * - reveal.js and sass are pinned exactly: a bump must be a deliberate PR,
 *   never a side effect of `npm update` or a caret range.
 * - a single copy of reveal.js must be installed (the one we re-export).
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')
) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    overrides?: Record<string, unknown>;
};

const EXACT = /^\d+\.\d+\.\d+$/;

describe('package.json manifest', () => {
    it('does not ship jsdom as a runtime dependency', () => {
        expect(pkg.dependencies).not.toHaveProperty('jsdom');
        expect(pkg.devDependencies).toHaveProperty('jsdom');
    });

    it('pins reveal.js to an exact version', () => {
        expect(pkg.dependencies['reveal.js']).toMatch(EXACT);
    });

    it('embeds reveal.js 6.0.2 exactly', () => {
        expect(pkg.dependencies['reveal.js']).toBe('6.0.2');
    });

    it('relies on the native reveal.js 6 types, not @types/reveal.js', () => {
        expect(pkg.dependencies).not.toHaveProperty('@types/reveal.js');
        expect(pkg.devDependencies).not.toHaveProperty('@types/reveal.js');
    });

    it('pins sass to an exact version', () => {
        expect(pkg.devDependencies['sass']).toMatch(EXACT);
    });

    it('needs no npm overrides (peer ranges resolve naturally)', () => {
        expect(pkg.overrides).toBeUndefined();
    });

    it('installs a single copy of reveal.js', () => {
        const out = execFileSync(
            'npm',
            ['ls', 'reveal.js', '--all', '--parseable', '--long'],
            { cwd: ROOT, encoding: 'utf-8' }
        );
        const copies = new Set(
            out
                .split('\n')
                .filter((l) => l.includes('node_modules/reveal.js:'))
                .map((l) => l.split(':')[0])
        );
        expect(copies.size).toBe(1);
    });
});
