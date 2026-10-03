# NovaMart TrustDesk — Data Schema and Seed Plan

## Data design rules
- IDs are opaque strings, never inferred from customer text.
- Monetary values are numeric INR values in prototype. Production would use integer minor units.
- ISO 8601 dates are required.
- Policies have structured rule fields and human-readable summaries.
- Customer messages are not authoritative facts.

## Customer
```ts
export type LoyaltyTier = "STANDARD" | "SILVER" | "GOLD";
export type Customer = {
  id: string;
  name: string;
  email: string;
  phoneMasked: string;
  loyaltyTier: LoyaltyTier;
  accountCreatedAt: string;
  refundRiskFlags: string[];
};
```

## Order
```ts
export type OrderStatus = "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";
export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};
export type Order = {
  id: string;
  customerId: string;
  status: OrderStatus;
  placedAt: string;
  deliveredAt?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryProof?: { otpVerified: boolean; deliveredAt?: string };
  items: OrderItem[];
  existingRefundAmount: number;
  existingReturnId?: string;
};
```

## Product
```ts
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  warrantyMonths: number;
  returnable: boolean;
  specifications: Record<string, string>;
  reviewSummary?: string;
};
```

## Policy
```ts
export type PolicyCategory = "RETURNS" | "REFUNDS" | "DELIVERY" | "WARRANTY";
export type Policy = {
  id: string;
  version: string;
  status: "ACTIVE" | "INACTIVE";
  effectiveFrom: string;
  effectiveTo?: string;
  category: PolicyCategory;
  rules: {
    standardReturnWindowDays?: number;
    goldTierExtensionDays?: number;
    restockingFeePercent?: number;
    autoRefundApprovalLimit?: number;
    requireReturnBeforeRefund?: boolean;
    otpDeliveryConflictRequiresEscalation?: boolean;
    suspiciousRefundRequiresEscalation?: boolean;
    warrantyRequiresSpecialist?: boolean;
  };
  humanReadableSummary: string;
};
```

## Support ticket and conversation
```ts
export type SupportTicket = {
  id: string;
  customerId: string;
  orderId?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  category: "DELIVERY" | "REFUND" | "RETURN" | "PAYMENT" | "WARRANTY";
  createdAt: string;
  summary: string;
  riskFlags: string[];
};
export type ConversationMessage = {
  id: string;
  customerId: string;
  orderId?: string;
  role: "CUSTOMER" | "AGENT";
  message: string;
  createdAt: string;
};
```

## Action store
```ts
export type ActionRecord = {
  id: string;
  type: "RETURN_CREATED" | "REFUND_CREATED" | "TICKET_CREATED" | "ESCALATION_CREATED";
  customerId: string;
  orderId?: string;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
  payload: Record<string, unknown>;
};
```

## Seed records required
### CUST-1001 — valid return
- Gold loyalty tier.
- Order `NM-1001`, delivered within Gold-extended window.
- Product `PRD-HEAD-01`, returnable headphones, order total 4,999.
- No open conflicting ticket; no risk flags.

### CUST-1002 — OTP delivery contradiction
- Standard tier.
- Order `NM-2002`, phone order total 14,999, delivered with `otpVerified: true`.
- Open delivery ticket, unresolved.
- Prior conversation mentions delivery investigation.

### CUST-1003 — suspicious refund pattern
- Standard tier.
- At least two prior refund-related open/resolved tickets.
- `refundRiskFlags: ["REPEATED_REFUND_REQUESTS"]`.

### CUST-1004 — warranty case
- Laptop order delivered approximately four months ago.
- Product warranty 12 months.
- Product may be outside standard return period but inside warranty.

## Seed policy records required
1. `RET-2.0`, inactive returns policy, shorter return window. Use to demonstrate version awareness.
2. `RET-3.0`, active returns policy, e.g. 14 standard days + 7 Gold extension. The actual values are seed data; code reads them.
3. `REF-1.0`, active refund policy, e.g. restocking fee and auto-approval threshold.
4. `DEL-1.0`, active delivery policy: OTP-delivery conflict escalates.
5. `WAR-1.0`, active warranty policy: verified warranty defects require specialist/support ticket, not automatic refund.

## Schema-level invariants
- Every order references an existing customer.
- Every order item references an existing product.
- Policy selection never returns inactive policy for current request date unless deliberately using an as-of-date test.
- Action record customer/order IDs must match verified context.
- A refund cannot be greater than `order.totalAmount - existingRefundAmount - restockingFee`.
- Existing return/refund state prevents duplicate action.
