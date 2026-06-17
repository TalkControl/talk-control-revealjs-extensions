---
name: release
description: >
  Publish a new version of the npm package @talk-control/talk-control-revealjs-extensions.
  Use when the user mentions "release", "publish", "npm publish", "new version", "bump version", or "tag".
  Guides step by step: working tree check, bump type choice, build, tests, version bump, commit, tag, push, publish.
---

# Release — npm Publication

## Overview

The release workflow is automated via `npm run release` (calls `scripts/release.ts`).

**Order of operations — build and tests run BEFORE bumping the version:**
1. Check clean working tree
2. Ask bump type (patch / minor / major)
3. Build — stops here if it fails (package.json unchanged)
4. Tests — stops here if they fail (package.json unchanged)
5. Bump version in package.json
6. git commit + git tag vX.Y.Z
7. git push + git push --tags
8. npm publish

## Running the Release

```bash
npm run release
```

The script is interactive — it will ask for the bump type and show progress for each step.

## Manual Step-by-Step (if the script fails mid-way)

### 1. Check clean working tree
```bash
git status --porcelain
```
If output is non-empty, commit or stash changes first.

### 2. Build
```bash
npm run build
```

### 3. Tests
```bash
npx vitest run
```
Note: use `npx vitest run` (single pass), NOT `npm run test` (watch mode).

### 4. Bump version
```bash
npm version patch --no-git-tag-version
# or: minor / major
```
`--no-git-tag-version` prevents npm from creating the git tag automatically.

### 5. Commit + Tag
```bash
git add package.json package-lock.json
git commit -m "chore: bump version to vX.Y.Z"
git tag vX.Y.Z
```

### 6. Push
```bash
git push
git push --tags
```

### 7. Publish
```bash
npm publish
```
`publishConfig.access: "public"` is already set in package.json — no `--access public` needed.

## If a Step Fails After the Commit

- Do NOT delete the git tag automatically
- `npm publish` can be re-run independently if push succeeded but publish failed
- Report what failed and suggest the exact command to resume
