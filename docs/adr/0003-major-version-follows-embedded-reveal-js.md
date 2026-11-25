---
status: 'accepted'
date: 2026-11-25
decision-makers: ['jefBinomed']
---

# A major version of the embedded reveal.js implies a major version of TalkControl

## Context and Problem Statement

TalkControl embeds reveal.js at an exact, pinned version (no range, no peer
dependency) and re-exports its API and types. Moving to reveal.js 6 (issue
#91) changed, for every consumer: the public types (`RevealApi`,
`RevealConfig`, native typings instead of `@types/reveal.js`), the Markdown
engine (marked 4 to 17, no automatic heading ids, token-based renderers), the
Sass variables of the theme, the plugin import paths and the rendered HTML/CSS.
The published versions so far were `1.0.0-rc-*` prereleases, with no stable
`1.0.0`. Which version number does such a change deserve, and what rule should
apply the next time reveal.js moves?

## Decision Drivers

- Consumers must be able to tell from the version number whether their decks
  can break.
- Because reveal.js is embedded and pinned, TalkControl, not the consumer,
  controls when reveal.js changes: the version number is the only warning.
- Ranges such as `^1.0.0-rc-4` (for example in downstream themes) accept any
  `1.x`, so only a major bump keeps them from upgrading automatically.
- Prefer a simple, mechanical rule over a case-by-case judgment.

## Considered Options

- Continue the `1.0.0` line (`1.0.0-rc-5`, then `1.0.0`) with reveal.js 6.
- Release `2.0.0` (first prerelease `2.0.0-rc.1`) with reveal.js 6, and adopt a
  rule tying TalkControl majors to reveal.js majors.
- Release `1.1.0-rc`.

## Decision Outcome

Chosen option: "Release `2.0.0` with reveal.js 6, and tie TalkControl majors
to reveal.js majors", because the move to reveal.js 6 is a real breaking change
for decks and downstream themes, a major bump is the only signal that keeps
`^1.x` ranges from upgrading silently, and a mechanical rule avoids
re-discussing the question at each reveal.js upgrade.

The rule:

- A new **major** version of the embedded reveal.js implies a new **major**
  version of TalkControl.
- A reveal.js minor or patch is a TalkControl minor or patch, unless it changes
  the public API or the rendering in a way the contract tests flag as breaking.
- Prereleases are published under the `next` dist-tag, never `latest`
  (`scripts/release.ts`).
- Every major ships a migration guide (`docs/migration-<major>.0.md`) listing
  each break with a before and an after.

## Consequences

- Good, because the version number carries the risk, and `^1.x` consumers do
  not upgrade by accident.
- Good, because the rule is mechanical and testable (reveal.js version in
  `package.json`, contract tests).
- Bad, because a `2.0.0` appears before any stable `1.0.0`, which can look odd
  to newcomers; the migration guide explains it.
- Bad, because a major bump of reveal.js forces a major of TalkControl even
  when the visible impact is small.

## More Information

- Migration guide: [`docs/migration-2.0.md`](../migration-2.0.md).
- Tracking issue: #91.
