// Shebang added by the Vite build's rollup `output.banner` (see
// vite.cli.config.ts) rather than inlined here, so `tsc` doesn't have to
// special-case a hashbang-prefixed entry file.
import { HELP_TEXT } from './help';
import { runCli } from './run';

async function main(): Promise<void> {
    const argv = process.argv.slice(2);

    if (argv.includes('--help') || argv.includes('-h')) {
        process.stdout.write(HELP_TEXT);
        process.exit(0);
    }

    const exitCode = await runCli(argv);
    process.exit(exitCode);
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
