#!/bin/bash
# Shared post-file-change hook — single implementation for every agent tool.
# Called by: .claude/settings.json, .agents/hooks.json, .gemini/settings.json,
#            .opencode/plugin/auto-format.ts (see AGENTS.md → "AI tooling").
# Usage: post-file-change.sh <filepath>
#
# Formats ONLY the changed file (never the whole repo) when it matches
# src/**/*.{ts,scss}. Any other path is skipped silently.

set -u

FILE_PATH="${1:-}"

if [ -z "$FILE_PATH" ]; then
    echo "❌ post-file-change.sh: no file path provided"
    exit 1
fi

# Only process .ts and .scss files under src/ (absolute or relative path)
if [[ ! "$FILE_PATH" =~ (^|/)src/.*\.(ts|scss)$ ]]; then
    exit 0
fi

if [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

echo "🔧 Formatting: $FILE_PATH"

STATUS=0
npx eslint --fix "$FILE_PATH" || STATUS=1
npx prettier --write "$FILE_PATH" || STATUS=1

if [ "$STATUS" -eq 0 ]; then
    echo "✅ Formatted: $FILE_PATH"
else
    echo "⚠️  Formatting had issues on: $FILE_PATH"
fi

exit "$STATUS"
