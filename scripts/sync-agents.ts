#!/usr/bin/env node
/**
 * Sync agent skills from the canonical source (.agents/) to the
 * tool-specific directories (.claude/, .gemini/, .opencode/).
 *
 * Usage:
 *   npm run agents:sync    # regenerate all tool-specific copies
 *   npm run agents:check   # verify copies are in sync (CI) — exit 1 on drift
 *
 * Never edit the generated copies directly: edit the source under
 * .agents/, then run `npm run agents:sync`.
 */
import * as fs from 'fs';
import * as path from 'path';

interface SyncEntry {
    source: string;
    targets: string[];
    /** Optional per-target transform (tool-specific format tweaks). */
    transform?: (content: string, target: string) => string;
}

const MANIFEST: SyncEntry[] = [
    {
        source: '.agents/skills/release/SKILL.md',
        targets: [
            '.claude/skills/release/SKILL.md',
            '.gemini/skills/release/SKILL.md',
            '.opencode/command/release.md',
        ],
    },
    {
        source: '.agents/skills/addon-scaffold/SKILL.md',
        targets: [
            '.claude/skills/addon-scaffold/SKILL.md',
            '.gemini/skills/addon-scaffold/SKILL.md',
            '.opencode/command/addon-scaffold.md',
        ],
    },
];

function banner(source: string): string {
    return `<!-- AUTO-GENERATED from ${source} — do not edit. Edit the source, then run: npm run agents:sync -->`;
}

/**
 * Inject the auto-generated banner. YAML frontmatter must stay first,
 * so the banner goes right after the closing `---` when present.
 */
function withBanner(content: string, source: string): string {
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[0];
        const body = content.slice(frontmatter.length);
        return `${frontmatter}\n${banner(source)}\n${body.replace(/^\n+/, '\n')}`;
    }
    return `${banner(source)}\n\n${content}`;
}

function expectedContent(entry: SyncEntry, target: string): string {
    const raw = fs.readFileSync(entry.source, 'utf8');
    const generated = withBanner(raw, entry.source);
    return entry.transform ? entry.transform(generated, target) : generated;
}

function sync(): void {
    for (const entry of MANIFEST) {
        for (const target of entry.targets) {
            const content = expectedContent(entry, target);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, content);
            console.log(`✅ ${entry.source} → ${target}`);
        }
    }
    console.log('\n🎉 Agent skills synced');
}

function check(): void {
    const drifted: string[] = [];
    for (const entry of MANIFEST) {
        for (const target of entry.targets) {
            const expected = expectedContent(entry, target);
            const actual = fs.existsSync(target)
                ? fs.readFileSync(target, 'utf8')
                : null;
            if (actual !== expected) {
                drifted.push(
                    `  - ${target} (${actual === null ? 'missing' : 'differs from'} source ${entry.source})`
                );
            }
        }
    }
    if (drifted.length > 0) {
        console.error('❌ Agent skills are out of sync:\n');
        console.error(drifted.join('\n'));
        console.error(
            '\nEdit the source under .agents/ (never the generated copies),'
        );
        console.error('then run: npm run agents:sync\n');
        process.exit(1);
    }
    console.log('✅ Agent skills are in sync');
}

if (process.argv.includes('--check')) {
    check();
} else {
    sync();
}
