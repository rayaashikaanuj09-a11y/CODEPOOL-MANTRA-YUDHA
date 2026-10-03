# CORE ENGINEERING RULE

## Status
**ALWAYS ON. MANDATORY.**

This rule is the permanent baseline for every project implementation task.

## Mandatory startup procedure
Before implementing, modifying, deleting, refactoring, generating, testing, configuring, or executing any project change:

1. Locate the current `RULES.md`.
2. Read the current `RULES.md` before taking implementation action.
3. Inspect the relevant project files and existing patterns.
4. Identify the smallest correct change.
5. Implement only what is necessary.
6. Verify the result.
7. Re-check compliance with `RULES.md` before completion.

**Never use remembered rules as a substitute for reading the current `RULES.md`.**

## Non-negotiable engineering rules
- Treat `RULES.md` as the authoritative project engineering standard.
- Treat the existing repository as the primary source of truth for architecture and conventions.
- Do not invent APIs, files, functions, database fields, environment variables, packages, data, test results, benchmarks, or project facts.
- Never claim that a test, build, API, migration, or deployment was verified unless it was actually verified.
- Prefer the smallest correct change.
- Preserve unrelated existing behaviour.
- Reuse existing patterns, utilities, components, services, dependencies, and infrastructure when appropriate.
- Do not introduce unnecessary abstractions, dependencies, files, architecture, or refactors.
- Do not rewrite working code without a concrete reason.
- Handle errors explicitly and appropriately.
- Treat external input as untrusted.
- Protect secrets and sensitive information.
- Consider regression, compatibility, security, performance, and data-integrity risks.

## Rules.md change handling
If `RULES.md` changes during a task:

1. Stop implementation.
2. Read the updated file.
3. Re-evaluate the task against the updated rules.
4. Continue only after applying the updated requirements.

## Missing rules file
If `RULES.md` genuinely cannot be located or read:

- Do not pretend it was read.
- Do not fabricate its contents.
- State that the authoritative rules file could not be read.
- Proceed only when necessary using the safest available engineering practices.

## Completion gate
Before declaring completion, verify:

- architecture consistency
- minimal diff
- correctness
- error handling
- security
- compatibility
- relevant tests or verification
- no fabricated claims
- compliance with the current `RULES.md`
