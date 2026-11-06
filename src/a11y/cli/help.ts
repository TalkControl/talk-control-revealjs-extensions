export const HELP_TEXT = `talk-control-a11y — internal accessibility scanner (axe-core via Playwright)

IMPORTANT: "no violations" does NOT mean "accessible". This tool only
reports what axe-core's automated rules can detect (roughly a third of
WCAG success criteria); manual checks (keyboard navigation, screen reader
testing, cognitive load, ...) remain necessary. "incomplete" results are
reported separately and are never counted as violations: they mean axe
could not decide automatically and a human must look.

Usage:
  talk-control-a11y [options]

Target (mutually exclusive, default: --dir demo):
  --url <deck-url>        Scan an already-running deck at this URL.
  --dir <folder>           Serve this static folder and scan it (default: demo).

Options:
  --theme <light|dark|both>  Theme(s) to scan (default: light). CI and the
                              default baseline stay light-only; dark-theme
                              contrast is tracked separately (see #101) and
                              must not pollute the shared baseline.
  --baseline <file>           Baseline JSON file path (default: a11y-baseline.json).
  --update-baseline            Rewrite the baseline file with this run's violations.
  --strict                     Exit 1 if any violation outside the baseline is found
                                (default: informative, always exits 0).
  --format <console|json>      Report output format (default: console).
  --slide <h>|<h>/<v>          Fallback: scan a single slide in its normal
                                (non print-pdf) rendering instead of the full
                                print-pdf + shell scan, e.g. --slide 2/1.
  --help                        Show this help and exit.

Internal/maintainer tool: no public API or CLI compatibility promise.
`;
