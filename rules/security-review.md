---
name: security-review
description: Performs focused security review of application code, APIs, authentication, authorization, input validation, secrets, files, database access, and external integrations.
---

# Security Review Skill

Treat all external input and external systems as untrusted unless verified otherwise.

## Mandatory first step
Read the current `RULES.md` and inspect the project's existing security architecture before reviewing code.

## Review areas

### Authentication
- token handling
- session management
- password handling
- credential storage
- authentication bypasses

### Authorization
- access-control boundaries
- role checks
- resource ownership checks
- privilege escalation

### Input and output
- injection
- XSS
- unsafe HTML rendering
- command execution
- SQL/NoSQL injection where applicable
- path traversal
- unsafe redirects
- untrusted deserialization

### Secrets
Look for:
- API keys
- passwords
- access tokens
- private credentials
- signing keys
- secrets embedded in source, logs, client bundles, or configuration committed to source control

### Files and uploads
Consider:
- path traversal
- arbitrary file access
- unsafe filenames
- malicious file types
- size limits
- storage isolation

### APIs and external services
Check:
- authentication
- authorization
- input validation
- timeout handling
- error leakage
- retry behaviour
- trust boundaries
- rate limiting where relevant

### Database
Check:
- parameterized queries
- authorization before access
- unsafe dynamic queries
- sensitive data exposure
- transaction integrity

## Rules
- Prefer the project's established security mechanisms.
- Do not introduce security controls that conflict with the repository without a concrete reason.
- Do not weaken security for convenience.
- Report real, evidence-based issues rather than generic fear-based warnings.
- Never claim a system is secure merely because no issue was found in a limited review.
