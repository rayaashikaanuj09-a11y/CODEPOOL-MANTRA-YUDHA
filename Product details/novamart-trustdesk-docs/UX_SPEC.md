# NovaMart TrustDesk — UX Specification

## UX premise
The UI must make the value obvious without a verbal explanation: **customer request on the left/center, verified facts in view, decision with proof on the right.** Avoid dashboard clutter.

## Screen 1: Support Resolution Console
### Layout
Desktop: three columns. Mobile: stack panels with Decision Receipt immediately after conversation.

| Area | Width | Purpose |
|---|---:|---|
| Customer Context | 25% | Identity, loyalty, recent orders, open tickets |
| Conversation | 40% | Chat history, request entry, sample scenarios, response |
| Decision Receipt | 35% | Final action, evidence, policy, risk, tool trace, verification |

### Header
- Product: `NovaMart TrustDesk`
- Subtitle: `Verified AI support decisions`
- Session status: `Demo sandbox · Local data`
- Optional reset button: `Reset demo state`

### Left: Customer Context
Required elements:
- Customer selector dropdown with name and customer ID.
- Loyalty tier badge.
- Compact risk badge: Low / Review / High.
- Recent Orders list: ID, product, status, total, delivered date.
- Open Tickets list: ticket ID, category, status.
- A note: `Order ownership is verified server-side.`

Interaction:
- Selecting a customer loads that customer's context and prior messages.
- Selected order cards are clickable only as contextual filters; do not imply approval.

### Center: Conversation
Required elements:
- Scrollable conversation history with Customer and NovaMart bubbles.
- Message textarea; placeholder: `Describe your order, delivery, return, refund, warranty, or payment issue…`
- Send button.
- Three sample scenario buttons:
  - `Run valid return`
  - `Run delivery contradiction`
  - `Run warranty claim`
- Processing state showing short, non-sensitive steps: `Retrieving context`, `Verifying order`, `Applying policy`, `Checking safety`, `Finalizing decision`.

Interaction:
- Send: add customer bubble immediately, disable submit while request runs, then append assistant response.
- Sample: selects the scenario's recommended customer, populates and submits the known message.
- Empty input: disable send.

### Right: Decision Receipt
Order of content is important.

1. **Final Decision**
   - Large badge: ANSWER blue, ASK amber, ACT green, ESCALATE red.
   - One-sentence reason.
2. **Resolution Plan**
   - Intent cards with icon and state: resolved, waiting, blocked, escalated.
3. **Verified Evidence**
   - Plain-language facts such as `Order NM-1001 belongs to customer CUST-1001`.
4. **Policy Applied**
   - Name/version, effective date, relevant structured rules.
5. **Risk & Safety**
   - Only visible flags. Good state: `No risk signals requiring escalation`.
6. **Tool Trail**
   - Tool name, status, one-line outcome. Never display raw hidden prompt.
7. **Action Verification**
   - Action type, local action ID, verified/failed status.
8. **View handoff pack** button when escalation exists.

## Screen 2: Human Handoff Pack modal
Open only for ESCALATE outcomes.

Required sections:
- Escalation ID and status.
- Customer snapshot: ID, tier, relevant risk flags.
- Customer request, quoted only as required.
- Detected intents and status.
- Verified evidence: order, delivery proof, ticket, conversation facts.
- Applied policies and relevant rules.
- Actions blocked and reasons.
- Recommended next human action.
- Linked support ticket ID.

Actions:
- `Close`.
- `Copy case summary` is optional; do not implement clipboard if time is limited.

## Screen 3: Optional Policy Inspector
Build only after core works.
- Policy category tabs.
- Version cards with effective dates and active state.
- Structured rule table.
- Highlight the policy selected for current decision.

## Visual system
- Background: neutral off-white or slate.
- Panels: white/dark-neutral cards with border and rounded corners.
- Fonts: system or Inter.
- Use high-contrast colored status badges, but do not rely on color alone; include icon/text.
- Avoid dense text. Evidence and tool rows are concise.
- Prefer progress disclosure: only show details after a decision exists.

## Error states
| State | UI behavior |
|---|---|
| No selected customer | Show selector prompt; do not enable scenario processing |
| Missing/unknown order | Return ASK with matching order cards when possible |
| LLM unavailable | Show small `Using deterministic fallback` note; continue normally |
| Tool validation blocked | Display blocked row and reason in Tool Trail |
| Action failure | Terminal action remains ACT only if validation passed; action verification section clearly says failed and creates escalation/ASK follow-up |

## Accessibility
- Keyboard-accessible buttons, modal, and dropdown.
- Badges use text labels.
- Tool/decision status is readable by screen readers.
- Do not use animations as sole feedback.
