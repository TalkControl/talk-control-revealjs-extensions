import { expect, test } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { runCli } from '../src/a11y/cli/run';
import { tmpdir } from 'node:os';

// talk-control-a11y drives its own Chromium instance internally (it is not
// a browser-fixture test): running it once is enough, the outer
// "chromium"/"firefox" Playwright projects would otherwise just repeat the
// exact same scan twice for no added coverage.
test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'the CLI launches its own browser; no need to repeat this under every Playwright project'
);

const FIXTURE_DIR = 'fixtures/a11y';

let workDir: string;
let baselineFile: string;

test.beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'tc-a11y-e2e-'));
    baselineFile = join(workDir, 'a11y-baseline.json');
});

test.afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
});

test('informative mode exits 0 even though the fixture has violations and no baseline exists yet', async () => {
    const exitCode = await runCli([
        '--dir',
        FIXTURE_DIR,
        '--baseline',
        baselineFile,
    ]);

    expect(exitCode).toBe(0);
});

test('--strict exits 1 for a violation not already in the baseline', async () => {
    const exitCode = await runCli([
        '--dir',
        FIXTURE_DIR,
        '--baseline',
        baselineFile,
        '--strict',
    ]);

    expect(exitCode).toBe(1);
});

test('--update-baseline rewrites the baseline file with the fixture violations', async () => {
    await runCli([
        '--dir',
        FIXTURE_DIR,
        '--baseline',
        baselineFile,
        '--update-baseline',
    ]);

    const baseline = JSON.parse(await readFile(baselineFile, 'utf-8'));
    const ruleIds = baseline.map(
        (entry: { ruleId: string }) => entry.ruleId
    ) as string[];

    expect(ruleIds).toEqual(
        expect.arrayContaining(['color-contrast', 'image-alt'])
    );
});

test('a violation recorded in the baseline no longer fails --strict', async () => {
    await runCli([
        '--dir',
        FIXTURE_DIR,
        '--baseline',
        baselineFile,
        '--update-baseline',
    ]);

    const exitCode = await runCli([
        '--dir',
        FIXTURE_DIR,
        '--baseline',
        baselineFile,
        '--strict',
    ]);

    expect(exitCode).toBe(0);
});
