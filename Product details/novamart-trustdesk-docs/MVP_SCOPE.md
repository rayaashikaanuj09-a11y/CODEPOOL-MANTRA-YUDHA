# NovaMart TrustDesk — MVP Scope

## Scope rule
**WORKING > DEMOABLE > SIMPLE > NOVEL > POLISHED > SCALABLE.**

The MVP is a single-page support console with seeded data and three repeatable scenarios. It must demonstrate verified decision-making, not broad enterprise functionality.

## Core features
| Feature | Acceptance criterion |
|---|---|
| Customer selector | Operator can choose one of at least three seeded customer sessions |
| Customer context | Selected customer's recent orders, loyalty tier, and open tickets are visible |
| Conversation input | Operator can type a request or trigger a controlled sample scenario |
| Context retrieval | Conversation history and open tickets are retrieved before decision output |
| Intent normalization | Message becomes one or more typed intents |
| Order verification | Order is returned only if it belongs to selected customer |
| Versioned policy lookup | UI shows policy version and rule used for return/refund/delivery/warranty decision |
| Refund calculator | Backend computes fee, maximum allowed refund, and threshold state |
| Terminal decision | Exactly one final action is selected: ANSWER, ASK, ACT, or ESCALATE |
| Local actions | Return, refund, support ticket, and escalation can be persisted in local action store |
| Action verification | Every write action is read back and marked success/failure |
| Decision Receipt | Shows evidence, policy, safety flags, tool trail, outcome, and verification |
| Escalation pack | Escalated case contains concise human-ready summary and recommended next step |
| Fallback mode | All sample scenarios function without external LLM/API access |

## Nice-to-have
- LLM structured intent extraction behind Zod validation.
- Typed free-text order ID extraction.
- Policy Inspector modal with version timeline.
- Small transition/loading animation for steps in the receipt.
- Customer-friendly copy generated from verified facts.
- Scenario reset button.
- Additional suspicious refund case.

## Explicit cuts
- Login, signup, passwords, OAuth, role management.
- Real payment/refund processing.
- Real SMS/email notifications.
- Live shipping/courier integrations.
- Vector database, embeddings, semantic search.
- Background queues, webhooks, microservices.
- Complex charts and management dashboards.
- Multi-language support.
- Arbitrary file uploads/photo analysis.
- A separate mobile application.

## Scope kill switches
| When | Condition | Action |
|---|---|---|
| At 60 minutes | Data and page shell are not visible | Stop styling; use plain cards and hardcoded seed data |
| At 120 minutes | Valid return is not completing | Skip LLM; use scenario-to-intent map and complete deterministic path |
| At 180 minutes | Local action persistence is unstable | Use in-memory action store for session and show verification from it |
| At 210 minutes | Multi-intent UI is unclear | Replace graph/cards with plain ordered checklist |
| At 240 minutes | Optional LLM not stable | Disable it from demo and describe fallback honestly |
| Final hour | Any extra feature threatens build/demo | Remove it; test only three scenarios |

## Minimum survivable demo
1. Select customer.
2. Click valid-return scenario.
3. Display verified order, active policy, computed refund cap, ACT decision, created return ID, and verified status.
4. Click OTP-conflict scenario.
5. Display security flag, delivery contradiction, ESCALATE decision, and human handoff pack.

## Definition of done
The MVP is done only when all of the following pass without manual data edits:
- `npm run build` succeeds.
- Valid return produces a verified action record.
- OTP conflict never creates refund or address-change action.
- Warranty request never routes to ordinary refund.
- UI remains useful when mock/LLM mode is enabled.
