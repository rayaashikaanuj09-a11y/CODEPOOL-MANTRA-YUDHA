---
name: testing
description: Designs, updates, and executes meaningful tests for features, bug fixes, APIs, components, business logic, integrations, and regressions.
---

# Testing Skill

Test behaviour, not implementation trivia.

## Mandatory first step
Read the current `RULES.md` and inspect the existing testing framework, conventions, fixtures, helpers, and test structure before adding or modifying tests.

## Before writing tests
Determine:

1. What behaviour is expected?
2. What existing behaviour must remain unchanged?
3. What edge cases are relevant?
4. What failure paths matter?
5. Which existing test utilities should be reused?

## Test categories
Use only the categories relevant to the task:

- unit tests
- integration tests
- API tests
- component tests
- end-to-end tests
- regression tests

## Coverage priorities
Consider:

- happy path
- invalid input
- empty input
- boundaries
- authorization failures
- external-service failures
- database failures
- retry/idempotency behaviour where relevant
- known regression cases

## Rules
- Do not create tests simply to increase test count.
- Do not over-mock the system when real behaviour should be tested.
- Prefer assertions about externally observable behaviour.
- Reuse repository fixtures and helpers.
- Keep tests deterministic.
- Avoid unnecessary timing assumptions.
- Do not fabricate test results.

## Verification
After modifying tests or implementation:

1. Run the smallest relevant test set.
2. Run broader verification when appropriate.
3. Investigate failures rather than suppressing them.
4. Report exactly what was executed and what was not.

Never state that tests pass unless they actually passed.
