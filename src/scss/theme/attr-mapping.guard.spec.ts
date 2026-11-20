import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guard against a `data-tc-*` attribute read via typed `attr()` in the SCSS
 * theme going undocumented (see docs/attributes.md and #52/#134).
 *
 * There is no finite JS table to compare against anymore (the
 * `tc-attr-polyfill` addon derives `--tc-X` from `data-tc-X` purely by
 * naming convention, see #134): the only thing worth guarding is that every
 * `data-tc-*` attribute actually referenced from an `attr(...)` call
 * anywhere in the SCSS theme is documented for deck authors, so nobody adds
 * one in CSS and forgets to tell anyone it exists.
 */
describe('every data-tc-* attribute read via attr() in the SCSS theme is documented (#52/#134)', () => {
    const themeDir = path.resolve(__dirname, '.');
    const docsPath = path.resolve(__dirname, '../../../docs/attributes.md');
    const docsContent = fs.readFileSync(docsPath, 'utf-8');

    function listScssFiles(dir: string): string[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries.flatMap((entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                return listScssFiles(fullPath);
            }
            return entry.name.endsWith('.scss') ? [fullPath] : [];
        });
    }

    const scssFiles = listScssFiles(themeDir);

    // Matches `attr(data-tc-some-name ...)`, case of the surrounding CSS
    // function call aside - the attribute name itself is always lower-kebab.
    const ATTR_CALL_PATTERN = /attr\(\s*(data-tc-[a-z0-9-]+)/g;

    const attributeNames = new Set<string>();
    for (const file of scssFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        for (const match of content.matchAll(ATTR_CALL_PATTERN)) {
            attributeNames.add(match[1]);
        }
    }

    it('found at least one data-tc-* attribute, to guard against a silently broken scan', () => {
        expect(attributeNames.size).toBeGreaterThan(0);
    });

    it.each(Array.from(attributeNames).sort())(
        'attribute "%s" is documented in docs/attributes.md',
        (attrName) => {
            expect(docsContent).toContain(attrName);
        }
    );
});
