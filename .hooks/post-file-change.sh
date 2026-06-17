#!/bin/bash
# Universal post-file-change hook
# Works with: git hooks, file watchers, CI/CD, IDE tools
# Usage: post-file-change.sh <filepath>

FILE_PATH="$1"
PROJECT_ROOT="${PROJECT_ROOT:-.}"

if [ -z "$FILE_PATH" ]; then
    echo "❌ FILE_PATH not provided"
    exit 1
fi

# Pattern match: only process .ts and .scss files in src/
if [[ "$FILE_PATH" =~ ^src/.*\.(ts|scss)$ ]]; then
    cd "$PROJECT_ROOT" || exit 1

    echo "🔧 Formatting: $FILE_PATH"
    npm run lint:fix 2>/dev/null || true
    npm run prettier:fix 2>/dev/null || true

    if [ $? -eq 0 ]; then
        echo "✅ Formatted: $FILE_PATH"
        exit 0
    else
        echo "⚠️  Formatting had issues"
        exit 1
    fi
fi

# File doesn't match pattern, skip silently
exit 0
