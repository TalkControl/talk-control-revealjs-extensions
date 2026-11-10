import { A11yViolation } from './types';

/**
 * Remove nodes already reported by an earlier scan pass (matched by rule id
 * + raw target selector, independent of the violation's `context`), so a
 * later pass over a different view of the same page (e.g. the shell pass
 * reusing the same `index.html`) never double-reports a document-level
 * finding (a `<meta>` tag, `<html lang>`, ...) picked up by both passes.
 * A violation left with no remaining nodes after filtering is dropped
 * entirely.
 */
export function dedupeAgainstPreviousPass(
    previousPassViolations: A11yViolation[],
    candidateViolations: A11yViolation[]
): A11yViolation[] {
    const seen = new Set<string>();
    for (const violation of previousPassViolations) {
        for (const node of violation.nodes) {
            seen.add(nodeKey(violation.id, node.target));
        }
    }

    return candidateViolations
        .map((violation) => ({
            ...violation,
            nodes: violation.nodes.filter(
                (node) => !seen.has(nodeKey(violation.id, node.target))
            ),
        }))
        .filter((violation) => violation.nodes.length > 0);
}

function nodeKey(ruleId: string, target: string[]): string {
    return [ruleId, target.join(' > ')].join('::');
}
