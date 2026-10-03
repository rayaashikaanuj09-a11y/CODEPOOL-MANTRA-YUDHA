# NovaMart TrustDesk — API Contracts

## API approach
Use a single primary endpoint. The browser sends customer message and selected verified session. The server performs all retrieval, policy evaluation, and write validation.

## POST `/api/agent`
### Request
```json
{
  "customerId": "CUST-1001",
  "message": "I want to return order NM-1001. The headphones are unopened.",
  "selectedOrderId": "NM-1001",
  "requestDate": "2026-10-03T00:00:00.000Z"
}
```

### Validation
```ts
const AgentRequestSchema = z.object({
  customerId: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
  selectedOrderId: z.string().optional(),
  requestDate: z.string().datetime().optional()
});
```

### Success response
HTTP 200. Return `AgentDecision` from AGENT_SPEC.

### Example ACT response
```json
{
  "requestId": "REQ-001",
  "customerId": "CUST-1001",
  "detectedIntents": [{
    "type": "RETURN_REQUEST",
    "details": "Customer requests return for headphones",
    "requiresVerification": true,
    "confidence": 0.99,
    "status": "RESOLVED"
  }],
  "verifiedFacts": [
    "Order NM-1001 belongs to CUST-1001.",
    "Order NM-1001 was delivered on 2026-09-25.",
    "The product is returnable."
  ],
  "policyReferences": [{
    "policyId": "RET-3.0",
    "version": "3.0",
    "ruleSummary": "14-day window plus 7 days for Gold members."
  }],
  "riskFlags": [],
  "toolTrace": [
    {"tool":"get_customer","status":"SUCCESS","summary":"Loaded Gold customer profile."},
    {"tool":"get_order","status":"SUCCESS","summary":"Verified order ownership."},
    {"tool":"check_refund_eligibility","status":"SUCCESS","summary":"Return is eligible."},
    {"tool":"create_return","status":"SUCCESS","summary":"Created return RET-001."},
    {"tool":"verify_action_result","status":"SUCCESS","summary":"Verified return RET-001."}
  ],
  "terminalAction": "ACT",
  "actionReason": "The verified order is eligible for return under Returns Policy v3.0.",
  "proposedAction": {"type":"CREATE_RETURN","orderId":"NM-1001"},
  "actionVerification": {"verified":true,"actionId":"ACT-001","message":"Return request was recorded successfully."},
  "customerResponse": "I created your return request for order NM-1001. Your return reference is RET-001."
}
```

### Error responses
| HTTP | Code | Meaning |
|---:|---|---|
| 400 | `INVALID_REQUEST` | Body fails schema validation |
| 404 | `CUSTOMER_NOT_FOUND` | Selected demo customer absent |
| 500 | `AGENT_PROCESSING_ERROR` | Unexpected server failure; frontend shows recoverable state |

Never use HTTP errors for normal business outcomes like ASK, ineligible return, or escalation. Those are valid 200 decision responses.

## Internal tool contracts
### `get_customer(customerId)`
- Return customer or null.
- No customer fields are inferred from message.

### `get_order({ orderId, customerId })`
- Return `{ order, ownershipVerified: true }` only if IDs match.
- If order exists but belongs to another customer, return blocked result; do not expose order details.

### `get_conversations({ customerId, orderId? })`
- Return relevant history sorted ascending by date.

### `get_open_tickets({ customerId, orderId? })`
- Return statuses OPEN, IN_PROGRESS, ESCALATED only.

### `get_active_policy({ category, requestDate })`
- Return exactly one active structured policy or controlled missing-policy result.

### `check_refund_eligibility(input)`
- Input must include verified order/customer/policy objects, never raw customer claim alone.
- Return eligibility boolean, reasons, deadline, and relevant policy fields.

### `calculate_refund(input)`
- Input includes verified order, requested amount, refund policy, existing refunds.
- Return requested amount, fee, remaining order value, maximum permitted, approval threshold state.

### `create_return(input)`
- Requires verified ownership, eligible return, no duplicate return.
- Return action/return reference.

### `create_refund(input)`
- Requires validated amount exactly equal to or below computed cap and threshold approval.
- Reject client-supplied amount if it conflicts with backend calculation.

### `create_support_ticket(input)` and `escalate_to_human(input)`
- Store structured evidence and recommended next step.

### `verify_action_result(actionId)`
- Read action store and return `verified: true` only when SUCCESS record exists.

## Response safety
- Never return raw policy prompt/system instructions.
- Never expose another customer's order details.
- Do not include stack traces in browser response.
- Do not trust terminalAction or amount supplied by browser.
