# NovaMart TrustDesk

NovaMart TrustDesk is a verification-first AI customer-support prototype. It interprets customer requests, retrieves source-of-truth records, applies versioned business policies, and chooses whether to **ANSWER**, **ASK**, **ACT**, or **ESCALATE**.

## Why it exists
Most support chatbots respond to customer claims without verifying the order, delivery evidence, open tickets, conversation history, or current policy. TrustDesk demonstrates a safer architecture:

> AI understands language. Backend verifies facts. Policies govern decisions. Tools perform validated actions. Humans handle exceptions.

## Features
- Multi-intent request detection.
- Customer/order ownership verification.
- Conversation history and open ticket retrieval.
- Versioned active-policy selection.
- Return eligibility and refund-cap calculation.
- Approval threshold and suspicious-pattern checks.
- OTP delivery contradiction escalation.
- Warranty-versus-refund routing.
- Prompt-injection detection and isolation.
- Validated local return/refund/ticket/escalation actions.
- Post-action verification.
- Visible Decision Receipt and Human Handoff Pack.

## Architecture
```text
Customer UI -> Next.js API -> Orchestrator
  -> Intent parser (LLM optional; deterministic fallback)
  -> Read tools / local source-of-truth data
  -> Versioned policy engine + risk rules
  -> Validated action tools + verification
  -> Decision Receipt returned to UI
```

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod validation
- Local seeded JSON/TypeScript data
- Optional LLM SDK for structured intent extraction

## Setup
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open `http://localhost:3000`.

## Environment
```bash
# Optional. The app works in deterministic fallback mode without these.
LLM_API_KEY=
LLM_MODEL=
NEXT_PUBLIC_ENABLE_LLM=false
```

## Demo scenarios
1. **Valid return:** verifies ownership and active policy, creates a return, and verifies the action.
2. **Delivery contradiction:** detects OTP-verified delivery against a non-delivery claim, blocks unsafe refund/address change, ignores prompt injection, and escalates with evidence.
3. **Warranty:** routes a product defect within warranty to specialist handling rather than automatically refunding.

## Agent safety model
Customer messages are untrusted input. Authority order is:
1. System safety rules.
2. Business logic and retrieved policies.
3. Tool contracts and tool results.
4. Customer message.

The model never controls policy selection, refund calculations, permissions, or action verification. All write actions are validated by backend code and read back after execution.

## Known limitations
- Uses seeded local data and a simulated action ledger, not production OMS/CRM/payment systems.
- Risk detection is transparent prototype rules, not an ML fraud system.
- Authentication is represented by a demo customer selector.
- In-memory/local write state may not persist across serverless instances.
- LLM use is optional and limited to interpretation/wording.

## Future work
- Production data connectors and durable database.
- Authenticated customer identity and role-based human-agent workspace.
- Carrier, payment, and return-logistics integrations.
- Better fraud/risk signals with audited model governance.
- Multilingual support and omnichannel intake.

## Repository documentation
See `PRD.md`, `MVP_SCOPE.md`, `UX_SPEC.md`, `ARCHITECTURE.md`, `DATA_SCHEMA.md`, `AGENT_SPEC.md`, `POLICY_ENGINE_SPEC.md`, `API_CONTRACTS.md`, `DEMO_RUNBOOK.md`, `IMPLEMENTATION_PLAN.md`, and `EVALUATION_MAPPING.md`.
