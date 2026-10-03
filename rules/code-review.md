---
name: code-review
description: Performs a senior-level review of existing or newly changed code for correctness, regressions, security, maintainability, performance, architecture consistency, and unnecessary complexity.
---

# Code Review Skill

Review code like a senior engineer reviewing a production pull request.

## Mandatory first step
Read the current `RULES.md` before reviewing project code.

## Review priorities
Review in this order:

1. Correctness
2. Security
3. Data integrity
4. Regressions and compatibility
5. Reliability and error handling
6. Architecture consistency
7. Maintainability
8. Performance
9. Test quality
10. Cosmetic concerns

## Look specifically for

### Correctness
- incorrect business logic
- incorrect assumptions
- missing edge cases
- state inconsistencies
- race conditions where relevant
- invalid type or null handling
- broken async behaviour

### AI-generated failure patterns
- invented APIs or fields
- generic placeholder implementations
- unnecessary defensive checks
- excessive abstraction
- repetitive boilerplate
- excessive comments
- duplicated logic
- giant functions
- meaningless variable names
- unnecessary wrappers
- code that does not match surrounding project style

### Security
- secret exposure
- authorization gaps
- unsafe input handling
- injection risks
- unsafe file operations
- sensitive information in logs or errors
- insecure client/server trust assumptions

### Performance
- N+1 queries
- unnecessary network calls
- repeated expensive computation
- avoidable rerenders
- unbounded operations
- excessive data loading

### Maintainability
- unclear responsibilities
- inconsistent architecture
- hidden coupling
- duplicated logic
- unnecessary dependencies
- speculative abstractions

## Review output
Report concrete findings.

For each finding, include:

- location
- issue
- why it matters
- practical fix

Do not praise code simply because it works.
Do not invent issues that are unsupported by the repository.
Do not fabricate test or runtime results.

## Completion rule
A review is not complete until the changed area has been checked against the current `RULES.md`.
