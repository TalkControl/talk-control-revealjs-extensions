---
name: addon-scaffold
description: >
  Generate a new addon for TalkControl following TypeScript + Vitest conventions.
  Use when the user says "create an addon", "new addon", "add an addon", or wants to generate
  src/addons/tc-{name}.ts and corresponding Vitest spec.
  Follow existing patterns: TcXxxOptions interface, manage/apply function, conditional _internals export,
  and Vitest spec with describe/it/beforeEach.
---

# Addon Scaffold — Addon Generator

## Purpose

Guide the user to create a new addon in two files:
- `src/addons/tc-{name}.ts` — implementation
- `src/addons/tc-{name}.spec.ts` — Vitest tests

Enforce consistency by following established project patterns.

## Conversational Workflow

### 1. Request Addon Name

**Ask**: "What is the addon name? (e.g., clipboard-history, syntax-highlight)"

Automatically derive from the provided name:
- **PascalCase** for the type (e.g., "clipboard-history" → `ClipboardHistory`)
- **camelCase** for the function (e.g., `manageClipboardHistory`)
- **kebab-case** for files (e.g., `tc-clipboard-history.ts`)

### 2. Request Addon Details

**Ask**:
- "Brief description of what this addon does?"
- "Will the function be manage[Name] or apply[Name]?" (default: manage)
- "Additional options beyond `active?: boolean`?" (If yes, list field names)
- "Any dependencies or mocks needed?" (e.g., import from '../utils/helper')

### 3. Generate TypeScript File

Create `src/addons/tc-{name}.ts` following this pattern:

```typescript
// Imports (adapt based on actual dependencies)
export interface Tc{PascalName}Options {
    active?: boolean;
    // + additional fields if applicable
}

/**
 * {Brief description from user}
 * @param options configuration options
 * @returns void
 */
export function {manage|apply}{PascalName}(options: Tc{PascalName}Options): void {
    if (!options.active) {
        return;
    }

    // TODO: Implement logic
}

// Private helper functions (optional)
// function _helperName(...) { ... }

// Export _internals (required pattern)
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              // Export testable helper functions here if applicable
              // _helperName,
          }
        : undefined;
```

### 4. Generate Spec File

Create `src/addons/tc-{name}.spec.ts` following this pattern:

```typescript
/**
 * @vitest-environment jsdom
 */
import { {manage|apply}{PascalName}, Tc{PascalName}Options } from './tc-{kebab-name}';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const HTML = `
<div class="reveal">
    <div class="slides">
        <!-- DOM fixture for tests -->
    </div>
</div>
`;

// vi.mock('../utils/helper', () => ({...})); // if needed

describe('{PascalName}', () => {
    beforeEach(() => {
        document.body.innerHTML = HTML;
    });

    it('should export the function', () => {
        expect({manage|apply}{PascalName}).toBeDefined();
    });

    it('should not do anything if options.active is false', () => {
        const options: Tc{PascalName}Options = { active: false };
        const result = {manage|apply}{PascalName}(options);
        expect(result).toBeUndefined();
    });

    it('should work when options.active is true', () => {
        const options: Tc{PascalName}Options = { active: true };
        // TODO: Add meaningful test for actual logic
        const result = {manage|apply}{PascalName}(options);
        expect(result).toBeUndefined();
    });
});
```

## Conventions (Mandatory)

- **Interface**: Always named `Tc{PascalName}Options`, ALWAYS includes `active?: boolean` as first field
- **Function**: Starts with `manage` or `apply` followed by PascalCase name
- **Helper functions**: Prefix with `_`, accessible only via `_internals` in test mode
- **_internals**: Conditional export returning helpers in test, `undefined` otherwise
- **Spec file**: Must include `@vitest-environment jsdom` directive, use `describe/it/beforeEach` structure
- **No over-abstraction**: Each addon is unique; don't force shared patterns prematurely

## Final Output

Display:
```
✅ Created src/addons/tc-{kebab-name}.ts
✅ Created src/addons/tc-{kebab-name}.spec.ts

Next steps:
  1. Implement logic in the .ts file
  2. Add meaningful tests in the .spec.ts file
  3. Run tests: npm run test -- {kebab-name}
```
