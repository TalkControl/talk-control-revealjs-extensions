import type { Result as AxeRawResult, CrossTreeSelector } from 'axe-core';
import { A11yViolation } from '../types';

/**
 * Convert a raw axe-core `Result` list (as returned by
 * `@axe-core/playwright`'s `AxeBuilder#analyze()`, for either `violations`
 * or `incomplete`) into this engine's `A11yViolation` shape, tagging every
 * node with the given scan context (e.g. `print-pdf:light` or
 * `shell:light`). A target segment that pierces a shadow root (reported by
 * axe-core as a nested array, e.g. for the LitHTML shell components) is
 * flattened into a single `>>>`-separated selector string.
 */
export function mapAxeResults(
    rawResults: AxeRawResult[],
    context: string
): A11yViolation[] {
    return rawResults.map((result) => ({
        id: result.id,
        context,
        nodes: result.nodes.map((node) => ({
            target: node.target.map(flattenSelector),
        })),
    }));
}

function flattenSelector(selector: CrossTreeSelector): string {
    return Array.isArray(selector) ? selector.join(' >>> ') : selector;
}
