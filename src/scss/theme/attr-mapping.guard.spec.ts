import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { _internals } from '../../addons/tc-attr-polyfill';

/**
 * Guard against the `data-tc-*` -> `--tc-*` mapping table (in
 * `src/addons/tc-attr-polyfill.ts`) drifting away from the SCSS that reads
 * it via typed `attr()` (see docs/attributes.md and #52). Every attribute
 * the polyfill knows about must be read by at least one of these two SCSS
 * files, otherwise the attribute would do nothing on a supporting browser.
 */
describe('data-tc-* attribute table stays in sync with the SCSS reading it (#52)', () => {
    const iconsScss = fs.readFileSync(
        path.resolve(__dirname, 'helpers/icons.scss'),
        'utf-8'
    );
    const admonitionScss = fs.readFileSync(
        path.resolve(__dirname, 'specifics/admonition.scss'),
        'utf-8'
    );
    const combinedScss = `${iconsScss}\n${admonitionScss}`;

    const attrNames = Object.keys(_internals?.ATTR_TO_CSS_VAR ?? {});

    it('has at least one mapped attribute to guard against a silently emptied table', () => {
        expect(attrNames.length).toBeGreaterThan(0);
    });

    it.each(attrNames)(
        'attribute "%s" is read by icons.scss or admonition.scss',
        (attrName) => {
            expect(combinedScss).toContain(attrName);
        }
    );
});
