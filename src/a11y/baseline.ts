import { A11yViolation, BaselineDiff, BaselineEntry } from './types';
import { computeFingerprint } from './fingerprint';

/**
 * Turn a scanned violation into the shape stored in the baseline file.
 */
export function toBaselineEntry(violation: A11yViolation): BaselineEntry {
    return {
        fingerprint: computeFingerprint(violation),
        ruleId: violation.id,
        context: violation.context,
        selectors: violation.nodes.map((node) => node.target.join(' > ')),
    };
}

/**
 * Compare the violations found in the current scan against a stored
 * baseline, splitting them into new (not in the baseline), resolved (in
 * the baseline but not found anymore) and known (in both).
 */
export function diffAgainstBaseline(
    currentViolations: A11yViolation[],
    baseline: BaselineEntry[]
): BaselineDiff {
    const currentEntries = currentViolations.map(toBaselineEntry);
    const baselineFingerprints = new Set(
        baseline.map((entry) => entry.fingerprint)
    );
    const currentFingerprints = new Set(
        currentEntries.map((entry) => entry.fingerprint)
    );

    return {
        newViolations: currentEntries.filter(
            (entry) => !baselineFingerprints.has(entry.fingerprint)
        ),
        resolvedViolations: baseline.filter(
            (entry) => !currentFingerprints.has(entry.fingerprint)
        ),
        knownViolations: currentEntries.filter((entry) =>
            baselineFingerprints.has(entry.fingerprint)
        ),
    };
}
