/**
 * Shared types for the a11y scan engine (src/a11y).
 *
 * These mirror the shape of an axe-core result (`id`, `nodes[].target`)
 * closely enough to be fed directly from `@axe-core/playwright` in a later
 * PR, without this package depending on axe-core or a browser.
 */

/**
 * A single DOM node flagged by a check, identified by its CSS selector
 * path (as axe-core's `target` does, including nested frames).
 */
export interface A11yNode {
    target: string[];
}

/**
 * One confirmed violation: a rule broken by one or more nodes, in a given
 * context (e.g. a slide id or a shell view name).
 */
export interface A11yViolation {
    id: string;
    context: string;
    nodes: A11yNode[];
}

/**
 * A check axe-core could not decide automatically (e.g. contrast on an
 * image background). Never counted as a violation.
 */
export type A11yIncomplete = A11yViolation;

/**
 * A violation recorded in the baseline, keyed by its stable fingerprint.
 */
export interface BaselineEntry {
    fingerprint: string;
    ruleId: string;
    context: string;
    selectors: string[];
}

export type Baseline = BaselineEntry[];

export interface BaselineDiff {
    newViolations: BaselineEntry[];
    resolvedViolations: BaselineEntry[];
    knownViolations: BaselineEntry[];
}

/**
 * Input of the report formatter: the baseline diff, plus the incomplete
 * checks for this run (always reported separately, never as violations).
 */
export interface A11yReportData extends BaselineDiff {
    incomplete: A11yIncomplete[];
}
