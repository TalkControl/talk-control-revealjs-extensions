import { A11yViolation } from './types';

/**
 * Compute a stable fingerprint for a violation: rule id + context (e.g. a
 * slide id or a shell view name) + the set of node selectors it was found
 * on. Two violations with the same rule, the same context and the same
 * selectors always produce the same fingerprint, whatever order their
 * nodes are listed in.
 */
export function computeFingerprint(violation: A11yViolation): string {
    const selectors = violation.nodes
        .map((node) => node.target.join(' > '))
        .sort();

    return [violation.id, violation.context, ...selectors].join('::');
}
