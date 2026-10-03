# NovaMart TrustDesk — Policy Engine Specification

## Design requirement
Policies are structured versioned data. Never hardcode return windows, loyalty extensions, restocking fees, or approval thresholds in the LLM prompt or frontend.

## Policy selection
Input: `category`, `requestDate` (and optionally order/relevant event date according to business rule).

Algorithm:
1. Filter policies by category.
2. Select policy where status is ACTIVE and `effectiveFrom <= requestDate < effectiveTo` when effectiveTo exists.
3. If no active policy matches, return a controlled failure. Do not infer a value.
4. Return policy ID, version, effective dates, structured rules, and human-readable summary.

## Return eligibility
Inputs:
- Verified order and ownership.
- Product returnability.
- Delivered date.
- Customer loyalty tier.
- Active returns policy.
- Existing return/refund state.

Calculation:
```text
allowedDays = standardReturnWindowDays
if customer.loyaltyTier == GOLD:
  allowedDays += goldTierExtensionDays

returnDeadline = deliveredAt + allowedDays
eligible = product.returnable
  AND order.status == DELIVERED
  AND currentDate <= returnDeadline
  AND no existing return for same order
```

Return reasons for both eligible and ineligible results. Examples:
- `Eligible: delivered 9 days ago, Gold window is 21 days.`
- `Ineligible: product was delivered 28 days ago; applicable window is 14 days.`
- `Ineligible: a return already exists for this order.`

## Refund calculation
Inputs:
- Verified order.
- Requested amount, if provided; otherwise remaining paid amount.
- Existing refund amount.
- Active refund policy.
- Return eligibility state.

Formula:
\[
\text{Maximum Refund} = \min(\text{Requested Amount},\ \text{Order Value} - \text{Existing Refunds} - \text{Restocking Fee})
\]

Where:
```text
restockingFee = round(order.totalAmount * restockingFeePercent / 100)
remainingOrderValue = max(0, order.totalAmount - existingRefundAmount)
maximumPermitted = max(0, min(requestedAmount, remainingOrderValue - restockingFee))
```

Rules:
- If requested amount is absent, set it to remainingOrderValue only for calculation; response must still state actual permitted amount.
- Never return a negative amount.
- If maximum permitted is zero, do not create refund.
- If policy requires return before refund, create return only; explain refund occurs after return verification.
- If `maximumPermitted > autoRefundApprovalLimit`, do not automatically refund; ESCALATE for approval.

## Delivery dispute policy
For delivery issue requests:
- Retrieve order delivery status and delivery proof.
- If `otpVerified` is true and customer claims non-delivery, add `OTP_DELIVERY_CONTRADICTION`.
- When delivery policy requires escalation, block automatic refund and choose ESCALATE.
- If package is already delivered, block address changes for that order.

## Warranty routing
For a defect/warranty intent:
1. Retrieve product warranty months and verified purchase/delivery date.
2. Determine whether within warranty period.
3. A warranty case is not an ordinary refund request by default.
4. If warranty policy requires specialist, create/escalate a WARRANTY ticket.
5. Explain that the issue is routed for warranty assessment; do not promise refund.

## Suspicious refund policy
Use transparent prototype rules; do not present as production fraud detection.
Escalate if one or more conditions apply:
- Customer profile has `REPEATED_REFUND_REQUESTS` or similar risk flag.
- Existing unresolved refund ticket exists for same order.
- Customer requests refund on order belonging to another customer.
- Requested amount is materially inconsistent with order total.
- Multiple refund requests are present in same message across several orders.

## Approval threshold
If calculated refund amount exceeds `autoRefundApprovalLimit`, action may be policy-eligible but cannot auto-execute. Terminal outcome: ESCALATE, with `APPROVAL_THRESHOLD_EXCEEDED` flag and calculated amount.

## Policy test cases
| Case | Expected outcome |
|---|---|
| Gold customer, delivered 18 days ago, 14-day standard + 7-day extension | Eligible if product returnable |
| Standard customer, delivered 18 days ago, 14-day window | Ineligible |
| Requested 8,000, order 6,499, fee 650 | Maximum refund is 5,849 |
| OTP verified delivery plus “never arrived” | Escalate; no auto-refund |
| Laptop defect after 4 months with 12-month warranty | Warranty ticket/escalation, not ordinary refund |
| Eligible refund above auto limit | Escalate for approval |
