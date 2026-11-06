/**
 * Compute the CLI exit code. Informative mode (the default) always exits
 * 0, even when violations are found: the CI job built on top of it stays
 * non-blocking. Strict mode exits 1 only when at least one violation
 * outside the baseline was found.
 */
export function computeExitCode(
    newViolationsCount: number,
    strict: boolean
): number {
    if (!strict) {
        return 0;
    }

    return newViolationsCount > 0 ? 1 : 0;
}
