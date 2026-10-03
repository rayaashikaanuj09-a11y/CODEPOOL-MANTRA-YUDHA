# NovaMart TrustDesk — Architecture

## Architectural decision
Use one Next.js App Router application with TypeScript. The system has no microservices, queues, external database, or mandatory external AI dependency.

## Principle
**LLM interprets; backend verifies; structured data stores truth; tools execute; humans receive exceptions.**

## Stack
| Technology | Role | Why |
|---|---|---|
| Next.js App Router | UI and API routes | Single deployable application; fast prototype loop |
| TypeScript | Domain and API typing | Prevents data/decision-shape mistakes |
| Tailwind CSS | UI styling | Fast card/panel layout implementation |
| Zod | Runtime validation | Validates request payloads, LLM JSON, and tool parameters |
| Local JSON data | Seeded source of truth | No connection/setup risk |
| Local action store | Simulated write-back ledger | Enables ACT plus post-action verification |
| Optional LLM SDK | Structured intent parsing and response wording | Adds NLP value but is non-critical |

## Logical components
```text
Browser UI
  -> POST /api/agent
    -> Orchestrator
       -> Input sanitizer and deterministic risk scan
       -> Intent parser (LLM primary, rule fallback)
       -> Context collector / read tools
       -> Policy selector
       -> Policy/risk decision engine
       -> Validated write tools when permitted
       -> Action verifier
       -> Response and handoff builder
  <- AgentDecision JSON
Browser renders Decision Receipt
```

## Data source
For MVP, `data/*.json` is source of truth. On initialization, read data into a repository abstraction. Writes go to an action store. Prefer an in-memory singleton in development if serverless file writes are unreliable; append the action record to response state and repository memory.

Important: do not claim durable production persistence if using in-memory storage.

## Folder structure
```text
app/
  api/agent/route.ts
  page.tsx
  layout.tsx
  globals.css
components/
  CustomerContextPanel.tsx
  ChatPanel.tsx
  DecisionReceipt.tsx
  HandoffPackModal.tsx
  TerminalActionBadge.tsx
  SampleScenarioButtons.tsx
lib/
  agent/orchestrator.ts
  agent/intent-parser.ts
  agent/deterministic-fallback.ts
  agent/decision-engine.ts
  agent/risk-detector.ts
  agent/response-generator.ts
  agent/handoff-builder.ts
  tools/*.ts
  policy/policy-selector.ts
  policy/policy-rules.ts
  data/repository.ts
  data/seed-data.ts
types/
  agent.ts
  customer.ts
  order.ts
  policy.ts
  ticket.ts
data/
  customers.json
  orders.json
  products.json
  policies.json
  tickets.json
  conversations.json
```

## Data flow
1. UI submits `{ customerId, message, selectedOrderId? }`.
2. API schema validates body and identifies selected verified session.
3. Sanitizer marks injection/legal/safety language but preserves legitimate support content.
4. Orchestrator retrieves customer, conversations, and open tickets first.
5. Parser returns normalized intents. Zod rejects malformed LLM output and triggers fallback.
6. For each intent, orchestrator requests only required records.
7. Policy selector retrieves active policy by category and relevant date.
8. Decision engine calculates eligibility/risk and constructs a single final decision.
9. If an ACT write is allowed, validate request parameters, execute local tool, read back result.
10. API returns `AgentDecision`; UI renders it.

## API boundary
Only `/api/agent` is required for the MVP. Read/action subroutes are optional and should exist only if they reduce code complexity or help isolated testing. The frontend must never directly mutate orders, refunds, tickets, or policy data.

## Environment variables
```bash
# Optional. App must work without these.
LLM_API_KEY=
LLM_MODEL=
NEXT_PUBLIC_ENABLE_LLM=false
```

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Deployment
Vercel-compatible deployment is optional. If deployed serverlessly, use in-memory state only for the current demo session or replace write persistence with a managed store only after core demo is stable. Record a local demo backup.

## Security constraints
- Never expose `LLM_API_KEY` to browser.
- Server validates all customer IDs, order IDs, requested amounts, and tool calls.
- No client-provided decision, amount, ownership, policy, or action status is trusted.
- Customer content is never interpreted as privileged instruction.
- Never return hidden system prompt text.
