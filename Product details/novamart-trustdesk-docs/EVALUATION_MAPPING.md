# NovaMart TrustDesk — Handbook Evaluation Mapping

## Core handbook requirements
| Handbook requirement | TrustDesk implementation | Proof visible to judge |
|---|---|---|
| Understand actual/multiple intents | Typed intent list and Resolution Plan | Multi-intent delivery scenario |
| Retrieve conversation history | `get_conversations` at start | Context panel + tool trail |
| Retrieve open tickets | `get_open_tickets` before final decision | Context panel + tool trail |
| Correct active policy version | Structured policy selector | Policy Applied card shows version/date |
| Verify before action | Ownership/policy/risk checks precede writes | Evidence/tool trail ordering |
| Explicit ANSWER/ASK/ACT/ESCALATE | `terminalAction` required in AgentDecision | Large final badge |
| Verify action result | `verify_action_result` after write | Action Verification card |
| Database is truth | Local structured records used over message claims | Evidence card and neutral responses |
| No hardcoded values | Policy values loaded from policy objects | Policy engine/documentation |
| Never fabricate | Typed repository returns only seeded records | ASK/missing-policy failure behavior |
| Refund cap | Deterministic calculator | Requested vs allowed amount shown |
| Approval thresholds | Refund policy threshold check | ESCALATE reason/flag |
| OTP contradiction | Delivery proof and escalation | Scenario B |
| Prompt injection | Pre-LLM deterministic flag and hierarchy | Safety card shows ignored attempt |
| Ambiguity | Do not randomly pick order | ASK when zero/multiple matches |
| Reuse memory | Conversation/ticket retrieval | Context records loaded once/session |
| Multi-intent dependencies | Ordered plan blocks refund/address when delivery conflict exists | Scenario B plan |

## Hidden evaluation category coverage
| Category | Prototype behavior | Scenario/test |
|---|---|---|
| 1. Policy versions | Select policy by active dates, display version | Policy v2 vs v3 data; current selection |
| 2. Approval thresholds | Escalate refund above auto limit | High value eligible order test |
| 3. Return windows | Calculate delivered date + tier extension | Gold versus Standard test |
| 4. Refund limits | Apply cap and fee formula | Requested > order value test |
| 5. Delivery claims | Check delivery/OTP proof | OTP contradiction scenario |
| 6. Suspicious refunds | Risk flags/duplicate refund tickets escalate | CUST-1003 test |
| 7. Ambiguous requests | Ask for selected order rather than guess | Multiple-order customer test |
| 8. Contradictory customers | Detect claim vs delivery proof conflict | Scenario B |
| 9. Warranty cases | Retrieve warranty and route to warranty handling | Scenario C |
| 10. Prompt injection | Ignore override requests and flag risk | Scenario B |
| 11. Multiple intents | Parse/order actions and dependencies | Scenario B |
| 12. Payment issues | Typed PAYMENT_ISSUE can retrieve status/ticket; answer/ask/escalate | Optional simple seeded test |
| 13. Safety/legal threats | Legal/safety scan triggers escalation | Message containing legal threat |

## Scoring narrative
### Prompt quality — 15
Structured-output intent prompt, explicit authority hierarchy, no policy/tool authority to LLM, injection-resistant design, Zod validation, deterministic fallback.

### Output quality — 20
Customer-friendly answers grounded in verified facts; visible terminal action and next step; handoff packet for exceptions.

### Creativity — 10
Decision Receipt turns usually hidden verification into an understandable product artifact. Handoff pack reframes escalation as valuable completion.

### Accuracy/relevance — 20
Local source-of-truth records, policy versioning, refund formula, ownership validation, action verification.

### Innovation — 20
Separation of language intelligence from authorization; evidence-first operational UX; policy/data-driven controls rather than prompt-only safety.

### Efficiency — 15
Only relevant tools are called; single application; local seed data; deterministic fallback; no unnecessary agent framework or infrastructure.

## Honest prototype boundaries
The prototype proves the decision pattern, not production integration scale. It uses simulated local actions instead of payment, logistics, and CRM systems. State this clearly in judging rather than overstating capabilities.
