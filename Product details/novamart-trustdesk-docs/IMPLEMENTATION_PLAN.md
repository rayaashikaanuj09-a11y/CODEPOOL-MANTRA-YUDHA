# NovaMart TrustDesk — Antigravity Implementation Plan

## Operating constraints
- Build one Next.js app.
- Prefer deterministic behavior over agent autonomy.
- Do not add external services until the core scenarios work.
- After each risky integration, stop and validate.

## Step 1 — Scaffold and layout
### Build
Create Next.js TypeScript app with Tailwind. Build static three-column support console and placeholder components.

### Files
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `components/CustomerContextPanel.tsx`
- `components/ChatPanel.tsx`
- `components/DecisionReceipt.tsx`
- `components/TerminalActionBadge.tsx`

### Done when
The page renders three labeled panels and sample buttons. No API needed.

## Step 2 — Types and seed data
### Build
Create domain TypeScript types and local JSON/TS seed data for four customers and five policies.

### Files
- `types/*.ts`
- `data/*.json` or `lib/data/seed-data.ts`
- `lib/data/repository.ts`

### Done when
Selecting a customer changes visible customer/orders/tickets/conversation data.

## Step 3 — Read tools and policy selection
### Build
Implement typed server-side repository functions: get customer/order/product/conversations/tickets/active policy.

### Files
- `lib/tools/get-*.ts`
- `lib/policy/policy-selector.ts`

### Tests
- Correct owner gets order.
- Wrong owner does not receive order details.
- Active policy is selected by category/date.

### Stop condition
Do not proceed until read tools return predictable typed results.

## Step 4 — Deterministic parser and risk detector
### Build
Implement fallback intent parser plus injection/legal/risk scan. It must handle the three seeded scenarios.

### Files
- `lib/agent/deterministic-fallback.ts`
- `lib/agent/risk-detector.ts`
- `lib/agent/intent-parser.ts`

### Done when
Given each sample message, parser outputs correct typed intents and flags.

## Step 5 — Policy engine
### Build
Implement return eligibility, refund calculation, delivery contradiction, threshold, warranty logic.

### Files
- `lib/policy/policy-rules.ts`
- `lib/tools/check-refund-eligibility.ts`
- `lib/tools/calculate-refund.ts`

### Tests
- Gold extension works.
- cap formula works.
- OTP contradiction escalates.
- warranty does not auto-refund.

## Step 6 — Write tools and verification
### Build
Implement action store and create-return/create-refund/create-ticket/escalate/verify functions.

### Files
- `lib/tools/create-return.ts`
- `lib/tools/create-refund.ts`
- `lib/tools/create-support-ticket.ts`
- `lib/tools/escalate-to-human.ts`
- `lib/tools/verify-action-result.ts`

### Done when
A valid return creates a record and verify action finds it. Invalid/over-limit operations are rejected.

### Stop condition
This is a risky persistence step. Test all writes before frontend integration.

## Step 7 — Orchestrator and API
### Build
Implement deterministic orchestration and `POST /api/agent`.

### Files
- `lib/agent/decision-engine.ts`
- `lib/agent/response-generator.ts`
- `lib/agent/handoff-builder.ts`
- `lib/agent/orchestrator.ts`
- `app/api/agent/route.ts`

### Done when
Curl/Postman or local fetch returns valid AgentDecision for all three scenarios.

## Step 8 — UI integration
### Build
Wire sample buttons and free-text input to API. Render loading state, conversation messages, and Decision Receipt.

### Done when
All scenarios run from UI with no manual code/data modifications.

## Step 9 — Handoff modal and polish
### Build
Add handoff modal, tool trace icons, collapsible evidence sections if needed. Keep styling simple.

### Done when
ESCALATE visibly opens usable human package.

## Step 10 — Optional LLM
### Build
Only if core is stable, add LLM parsing behind environment flag. Validate structured output with Zod; fall back silently on failure.

### Kill criterion
If not working in 25 minutes, remove/disable model path and retain deterministic fallback.

## Six-hour schedule
| Time | Objective | Definition of done |
|---|---|---|
| 0–1h | Scaffold, layout, types, seed data | Customer selector + static three columns |
| 1–2h | Read tools + policy selector + parser | Scenario messages parse and load verified context |
| 2–3h | Policy engine + return/refund calculations | Valid/invalid calculations pass manual tests |
| 3–4h | Write tools + orchestrator/API | Valid ACT and unsafe ESCALATE return JSON decisions |
| 4–5h | UI integration + handoff | Controlled scenarios work end-to-end |
| 5–6h | Stabilize, README, recording | Build passes; demo rehearsed; fallback verified |
