# NovaMart TrustDesk — Demo Runbook

## Goal
Deliver a controlled 2-minute live demo that proves the system is more than a chatbot: it verifies, applies policy, safely acts, and escalates with evidence.

## Pre-demo checklist
- Run `npm run build` once.
- Start local app and open browser at stable zoom (90–100%).
- Reset demo state.
- Confirm sample buttons are visible.
- Keep LLM disabled or fallback-ready unless tested reliably.
- Ensure the Decision Receipt panel is visible without scrolling.

## 30-second opening
Say:
> “Most support bots answer from what the customer says. NovaMart TrustDesk treats that as untrusted input. It verifies records, retrieves the active policy, chooses whether it can safely act, and gives every decision a receipt.”

Point to the three columns:
> “The customer request is in the middle, verified context is on the left, and the decision receipt is on the right.”

## Demo 1: safe automatic return — 40 seconds
### Click
Click `Run valid return`.

### Say
> “This Gold customer wants to return recently delivered headphones. The system first retrieves their conversation history and open tickets, then verifies the order belongs to them.”

### Point out
- Customer Context: Gold tier, order NM-1001.
- Decision Receipt: intent `RETURN_REQUEST` / `REFUND_REQUEST`.
- Verified Evidence: ownership and delivery date.
- Policy Applied: Returns v3.0 and its loyalty extension.
- Tool Trail: only relevant tools, not every possible tool.

### Wow moment
When `ACT` appears and action verification completes, say:
> “It did not merely promise a return. The backend created the return, read the action record back, and displayed a verified reference.”

## Demo 2: contradictory delivery + injection — 55 seconds
### Click
Click `Run delivery contradiction`.

### Say
> “Now the customer says the phone never arrived, asks for ₹20,000, asks to change the address, and tries to override policy instructions.”

### Point out
- Resolution Plan: three separate intents.
- Risk & Safety: prompt injection attempt detected and ignored.
- Verified Evidence: order ownership and OTP-verified delivery.
- Policy Applied: Delivery policy requiring specialist review for OTP conflict.
- Address change blocked because order is delivered.
- Refund not created despite customer demand.

### Wow moment
When `ESCALATE` appears, say:
> “A generic bot might apologize and refund. Our agent sees a contradiction, refuses unsafe money movement, and creates a human-ready escalation with the order, delivery proof, policy, existing ticket, and recommended next step.”

Click `View handoff pack`.

## Demo 3: warranty routing — 25 seconds
### Click
Click `Run warranty claim`.

### Say
> “This customer requests a refund for a laptop that stopped charging after four months. The product is outside ordinary return handling but inside the verified warranty period.”

### Point out
- Product warranty evidence.
- Warranty policy.
- Ticket/escalation path rather than an invented automatic refund.

## 15-second close
Say:
> “The key is separation of responsibility: AI understands language; deterministic backend logic owns policy and money; tools are validated and verified; humans receive only the exceptions with complete context.”

## Backup demo mode
If free-text processing is broken:
- Use only the three sample scenario buttons.
- State honestly: “The demo mode uses a deterministic intent fallback so the same policy and tool controls remain testable without external model dependency.”

If action persistence is broken:
- Do not fake a successful action.
- Demonstrate decision/validation path and show an intentional failed verification leading to escalation.

## 3–5 minute recording outline
1. Problem and product: 20 sec.
2. Architecture/guardrail explanation: 30 sec.
3. Valid ACT case: 60 sec.
4. Unsafe ESCALATE case: 75 sec.
5. Warranty case: 30 sec.
6. Differentiation and limitation: 25 sec.
