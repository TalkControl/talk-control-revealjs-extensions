import { A11yIncomplete, A11yViolation } from '../types';
import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from 'playwright';
import { mapAxeResults } from './axe-mapping';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

export interface ScanResult {
    violations: A11yViolation[];
    incomplete: A11yIncomplete[];
}

/**
 * Run axe-core (via `@axe-core/playwright`) against the given page, tagging
 * every finding with `context`. When `includeSelector` is given, the scan is
 * scoped to that subtree only (used for the shell pass, so it never
 * re-evaluates the slide content already covered by the print-pdf pass).
 */
export async function scanPage(
    page: Page,
    context: string,
    includeSelector?: string
): Promise<ScanResult> {
    const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
    if (includeSelector) {
        builder.include(includeSelector);
    }
    const results = await builder.analyze();

    return {
        violations: mapAxeResults(results.violations, context),
        incomplete: mapAxeResults(results.incomplete, context),
    };
}
