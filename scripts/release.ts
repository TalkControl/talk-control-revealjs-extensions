#!/usr/bin/env node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as readline from 'readline';

interface PackageJson {
    version: string;
}

async function askQuestion(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function release() {
    try {
        console.log('📦 Release\n');

        // Step 1: Check clean working tree
        console.log('1️⃣  Checking working tree...');
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            console.error('❌ Working tree is dirty. Commit or stash changes first.');
            process.exit(1);
        }
        console.log('✅ Working tree is clean\n');

        // Read current version for display
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as PackageJson;
        console.log(`Current version: ${pkg.version}`);

        // Step 2: Ask for bump type
        const bumpType = await askQuestion(
            '2️⃣  Bump type (patch/minor/major)? [patch] '
        );
        const bump = (bumpType || 'patch') as 'patch' | 'minor' | 'major';
        console.log();

        // Step 3: Build (BEFORE version bump)
        console.log('3️⃣  Building...');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build successful\n');

        // Step 4: Test (BEFORE version bump)
        console.log('4️⃣  Running tests...');
        execSync('npx vitest run', { stdio: 'inherit' });
        console.log('✅ Tests passed\n');

        // Step 5: Update version (ONLY if build + tests pass)
        console.log('5️⃣  Bumping version...');
        execSync(`npm version ${bump} --no-git-tag-version`, {
            stdio: 'inherit',
        });
        const newPkg = JSON.parse(
            fs.readFileSync('package.json', 'utf8')
        ) as PackageJson;
        const newVersion = newPkg.version;
        console.log(`✅ Version bumped to ${newVersion}\n`);

        // Step 6: Commit + Tag
        console.log('6️⃣  Committing and tagging...');
        execSync('git add package.json package-lock.json', {
            stdio: 'inherit',
        });
        execSync(
            `git commit -m "chore: bump version to v${newVersion}\n\nCo-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"`,
            { stdio: 'inherit' }
        );
        execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
        console.log(`✅ Commit & tag created (v${newVersion})\n`);

        // Step 7: Push
        console.log('7️⃣  Pushing to remote...');
        execSync('git push', { stdio: 'inherit' });
        execSync('git push --tags', { stdio: 'inherit' });
        console.log('✅ Pushed to remote\n');

        // Step 8: Publish
        console.log('8️⃣  Publishing to npm...');
        execSync('npm publish', { stdio: 'inherit' });
        console.log(`✅ Published v${newVersion}\n`);

        console.log('🎉 Release complete!');
    } catch (error) {
        console.error('\n❌ Release failed:', (error as Error).message);
        console.error('⚠️  package.json was NOT modified\n');
        process.exit(1);
    }
}

release();
