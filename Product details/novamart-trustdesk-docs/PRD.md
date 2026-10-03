# NovaMart TrustDesk — Product Requirements Document

## Product summary
NovaMart TrustDesk is a verification-first AI customer-support console for a fictional e-commerce company. It turns a customer message into a controlled support decision: **ANSWER**, **ASK**, **ACT**, or **ESCALATE**.

The product is deliberately not a generic chatbot. The AI interprets natural language and writes customer-friendly explanations. Deterministic backend logic retrieves source-of-truth records, selects the applicable versioned policy, computes eligibility and refund limits, validates actions, and verifies that completed actions were recorded.

## Problem
Generic customer-support chatbots often reply from a customer message without checking the actual order, prior conversation, ticket history, delivery evidence, or policy version. This creates inaccurate answers, unauthorized refunds, inconsistent decisions, and slow human escalation.

## Target users
| User | Need |
|---|---|
| Customer | Fast, accurate, contextual resolution without repeating facts |
| Support agent | A ready-to-resolve escalation instead of an unstructured transcript |
| Support operations lead | Consistent policy enforcement and fewer avoidable manual reviews |
| Finance/risk team | No unapproved or over-limit refunds; auditable actions |

## One-sentence pitch
NovaMart TrustDesk is an AI customer-support agent that verifies customer claims against live-style records and versioned policies, safely resolves eligible cases, and gives every decision an auditable receipt.

## Product goals
- Demonstrate end-to-end verified support resolution in a controlled hackathon prototype.
- Explicitly select ANSWER, ASK, ACT, or ESCALATE for each request.
- Make policy and evidence visible through a Decision Receipt.
- Show a successful automated action and a safe escalation.
- Work without an LLM or network connection using deterministic fallbacks.

## Non-goals
- Production authentication, payment rails, courier integrations, or email sending.
- Full ingestion of the public competition dataset.
- A general-purpose autonomous agent framework.
- A complete support-admin platform or analytics dashboard.
- Hidden chain-of-thought display. Show concise evidence and decision summaries only.

## Core workflow
1. A demo operator selects a verified customer session.
2. The customer submits a message or uses a seeded scenario.
3. The system treats the message as untrusted input and detects security/risk language.
4. The system retrieves conversation history and open tickets.
5. The system identifies one or more intents.
6. It retrieves and verifies order, product, and customer records as necessary.
7. It retrieves the relevant active policy version.
8. Deterministic logic evaluates eligibility, refund amount, threshold, contradictions, and risk.
9. The system chooses ANSWER, ASK, ACT, or ESCALATE.
10. If it acts, it validates the write request, creates a local action record, then reads it back to verify success.
11. The UI displays a Decision Receipt and customer-facing response.

## Success criteria
### Functional acceptance
- Valid return scenario creates an eligible return and shows verified action ID.
- Excess refund requests cannot exceed backend-calculated refund cap.
- Order ownership is validated against the selected customer.
- Relevant active policy versions are retrieved from structured data, not hardcoded in prompt text.
- OTP-delivered/non-delivery contradictions cause escalation, not automatic refund.
- Prompt-injection language is ignored and recorded as a safety flag.
- Existing open tickets and relevant conversation history are loaded before the decision.
- The agent works through deterministic fallback if LLM call fails.

### Demo acceptance
- A judge can understand the product in 15 seconds.
- A successful ACT case takes less than 45 seconds to demonstrate.
- An ESCALATE case visibly explains why action was blocked and presents a handoff pack.
- Every important decision is visible in the Decision Receipt.

## Primary demo scenarios
### Scenario A: eligible return
Customer asks to return a recently delivered, unopened product. The system verifies order ownership, applies active return/refund policy, calculates a permissible amount, creates the return, verifies it, and returns ACT.

### Scenario B: contradictory delivery + prompt injection
Customer claims a phone never arrived, requests an excessive refund and address change, and attempts to override instructions. The system detects three intents, checks OTP delivery proof, ignores the injection, blocks unsafe automatic actions, creates an escalation, and returns ESCALATE.

### Scenario C: warranty routing
Customer says a laptop stopped charging after four months and asks for a refund. The system retrieves warranty information, recognizes this is a warranty rather than ordinary return case, creates/escalates a warranty ticket, and does not auto-refund.

## Core metrics for presentation
- Resolution terminal action: ANSWER / ASK / ACT / ESCALATE.
- Evidence checks completed.
- Policy version applied.
- Amount requested vs. maximum permitted refund.
- Action verification status.
- Human-handoff completeness for escalated cases.

## Product principles
1. Database records are source of truth; customer claims are not.
2. AI can interpret language but cannot set policy, money, or permissions.
3. No write action occurs without validated inputs and deterministic authorization.
4. The system prefers clarification or escalation over unsafe automation.
5. Every action is verified after execution.
