import { A11yReportData, BaselineEntry } from './types';

export const REPORT_SCHEMA_VERSION = 1;

export type ReportFormat = 'console' | 'json';

export interface A11yJsonReport {
    schemaVersion: number;
    summary: {
        new: number;
        resolved: number;
        known: number;
        incomplete: number;
    };
    violations: {
        new: BaselineEntry[];
        resolved: BaselineEntry[];
        known: BaselineEntry[];
    };
    incomplete: A11yReportData['incomplete'];
}

/**
 * Format a scan report for either the console (human-readable text) or
 * JSON (versioned, machine-readable schema). `incomplete` checks are
 * always reported separately and never counted as confirmed violations.
 */
export function formatReport(
    data: A11yReportData,
    format: ReportFormat
): string {
    return format === 'json'
        ? JSON.stringify(toJsonReport(data), null, 2)
        : toConsoleReport(data);
}

function toJsonReport(data: A11yReportData): A11yJsonReport {
    return {
        schemaVersion: REPORT_SCHEMA_VERSION,
        summary: {
            new: data.newViolations.length,
            resolved: data.resolvedViolations.length,
            known: data.knownViolations.length,
            incomplete: data.incomplete.length,
        },
        violations: {
            new: data.newViolations,
            resolved: data.resolvedViolations,
            known: data.knownViolations,
        },
        incomplete: data.incomplete,
    };
}

function toConsoleReport(data: A11yReportData): string {
    const lines: string[] = [
        `a11y report: ${data.newViolations.length} new, ${data.resolvedViolations.length} resolved, ${data.knownViolations.length} known, ${data.incomplete.length} incomplete`,
    ];

    appendViolationsSection(lines, 'New violations', data.newViolations);
    appendViolationsSection(
        lines,
        'Resolved violations',
        data.resolvedViolations
    );

    return lines.join('\n');
}

function appendViolationsSection(
    lines: string[],
    title: string,
    entries: BaselineEntry[]
): void {
    if (entries.length === 0) {
        return;
    }

    lines.push('', `${title}:`);
    for (const entry of entries) {
        lines.push(`  - [${entry.ruleId}] ${entry.context}`);
    }
}
