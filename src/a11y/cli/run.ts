import { A11yIncomplete, A11yViolation } from '../types';
import { A11ySlideOverride, parseArgs } from '../args';
import { Browser, Page, chromium } from 'playwright';
import { StaticServer, startStaticServer } from './static-server';
import { readBaseline, writeBaseline } from './baseline-io';
import { computeExitCode } from '../exit-code';
import { dedupeAgainstPreviousPass } from '../dedupe';
import { diffAgainstBaseline } from '../baseline';
import { formatReport } from '../report';
import { scanPage } from './scan';

const READY_SELECTOR = '.reveal.ready';
const SHELL_ROOT_SELECTOR = '#ui-slide-selector';
const SHELL_WAIT_TIMEOUT_MS = 3000;

type Theme = 'light' | 'dark';

interface PassesResult {
    violations: A11yViolation[];
    incomplete: A11yIncomplete[];
}

/**
 * Run the full talk-control-a11y CLI: parse arguments, scan the target deck
 * (print-pdf content pass + shell pass, or a single `--slide` fallback
 * pass), diff against the baseline, print the report and return the
 * process exit code (the caller is responsible for `process.exit`).
 */
export async function runCli(argv: string[]): Promise<number> {
    const args = parseArgs(argv);
    let server: StaticServer | undefined;

    try {
        let baseUrl: string;
        if (args.target.type === 'url') {
            baseUrl = args.target.url;
        } else {
            server = await startStaticServer(args.target.dir);
            baseUrl = server.url;
        }

        const themes: Theme[] =
            args.theme === 'both' ? ['light', 'dark'] : [args.theme];

        const browser = await chromium.launch();
        try {
            const allViolations: A11yViolation[] = [];
            const allIncomplete: A11yIncomplete[] = [];

            for (const theme of themes) {
                const result = args.slide
                    ? await runSlidePass(browser, baseUrl, theme, args.slide)
                    : await runFullPasses(browser, baseUrl, theme);
                allViolations.push(...result.violations);
                allIncomplete.push(...result.incomplete);
            }

            const baseline = readBaseline(args.baselineFile);
            const diff = diffAgainstBaseline(allViolations, baseline);

            if (args.updateBaseline) {
                await writeBaseline(args.baselineFile, [
                    ...diff.knownViolations,
                    ...diff.newViolations,
                ]);
            }

            const report = formatReport(
                { ...diff, incomplete: allIncomplete },
                args.format
            );
            process.stdout.write(`${report}\n`);

            return computeExitCode(diff.newViolations.length, args.strict);
        } finally {
            await browser.close();
        }
    } finally {
        if (server) {
            await server.close();
        }
    }
}

/**
 * Pass 1 (content): `?print-pdf`, whole single-page DOM (all slides and
 * fragments stacked). Pass 2 (shell, short): normal view, config panel
 * opened with the `C` key, scanned scoped to its own subtree only. Pass 2's
 * findings are deduped against pass 1's so a document-level rule (e.g. a
 * `<meta>` tag) picked up by both isn't reported twice.
 */
async function runFullPasses(
    browser: Browser,
    baseUrl: string,
    theme: Theme
): Promise<PassesResult> {
    const context = await browser.newContext();
    try {
        const page = await context.newPage();

        await page.goto(buildUrl(baseUrl, { printPdf: true, theme }));
        await page.waitForSelector(READY_SELECTOR);
        await clearStalePrintAriaHidden(page);
        const content = await scanPage(page, `print-pdf:${theme}`);

        await page.goto(buildUrl(baseUrl, { printPdf: false, theme }));
        await page.waitForSelector(READY_SELECTOR);
        await page.keyboard.press('c');
        const hasShell = await page
            .waitForSelector(SHELL_ROOT_SELECTOR, {
                state: 'visible',
                timeout: SHELL_WAIT_TIMEOUT_MS,
            })
            .then(() => true)
            .catch(() => false);

        // Not every scanned deck uses TalkControl's shell (config panel,
        // `C` key): a plain reveal.js deck, or one where #67 moved the
        // binding, simply has no shell to scan. Skip pass 2 rather than
        // failing the whole run.
        const shellRaw = hasShell
            ? await scanPage(page, `shell:${theme}`, SHELL_ROOT_SELECTOR)
            : { violations: [], incomplete: [] };

        return {
            violations: [
                ...content.violations,
                ...dedupeAgainstPreviousPass(
                    content.violations,
                    shellRaw.violations
                ),
            ],
            incomplete: [
                ...content.incomplete,
                ...dedupeAgainstPreviousPass(
                    content.incomplete,
                    shellRaw.incomplete
                ),
            ],
        };
    } finally {
        await context.close();
    }
}

/**
 * `--slide` fallback: scan a single slide in its normal (non print-pdf)
 * rendering, scoped to the currently presented `<section>`. Manual
 * override/escape hatch, not exercised by the default CI run.
 */
async function runSlidePass(
    browser: Browser,
    baseUrl: string,
    theme: Theme,
    slide: A11ySlideOverride
): Promise<PassesResult> {
    const context = await browser.newContext();
    try {
        const page = await context.newPage();
        const hash =
            slide.v !== undefined ? `#/${slide.h}/${slide.v}` : `#/${slide.h}`;
        const label =
            slide.v !== undefined ? `${slide.h}/${slide.v}` : `${slide.h}`;

        await page.goto(
            `${buildUrl(baseUrl, { printPdf: false, theme })}${hash}`
        );
        await page.waitForSelector(READY_SELECTOR);

        return await scanPage(
            page,
            `slide:${label}:${theme}`,
            '.reveal .slides section.present'
        );
    } finally {
        await context.close();
    }
}

/**
 * reveal.js's print-pdf layout stacks every slide into its own `.pdf-page`,
 * forcing each one visible via an inline `display` style for printing — but
 * it leaves the `hidden`/`aria-hidden="true"` attributes it uses for normal
 * (non-print) slide switching in place on every `<section>` except the one
 * matching the deck's slide at load time. Those attributes don't reflect
 * reality once forced visible for print, yet several axe-core rules (e.g.
 * `image-alt`) respect `aria-hidden` ancestry and silently treat that
 * content as intentionally excluded, under-reporting real violations on
 * every slide but the first. Clearing them (scoped to `<section>` tags only
 * — reveal.js's own slide-stacking markers, never an author's own
 * decorative `aria-hidden` element) corrects the scan without touching
 * anything an author genuinely hid on purpose.
 */
async function clearStalePrintAriaHidden(page: Page): Promise<void> {
    await page.evaluate(() => {
        document
            .querySelectorAll(
                '.pdf-page section[aria-hidden], .pdf-page section[hidden]'
            )
            .forEach((section) => {
                section.removeAttribute('aria-hidden');
                section.removeAttribute('hidden');
            });
    });
}

function buildUrl(
    baseUrl: string,
    options: { printPdf: boolean; theme: Theme }
): string {
    const url = new URL(
        'index.html',
        baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    );
    if (options.printPdf) {
        url.searchParams.set('print-pdf', '');
    }
    if (options.theme === 'dark') {
        url.searchParams.set('data-theme', 'dark');
    }
    return url.toString();
}

export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? { buildUrl }
        : undefined;
