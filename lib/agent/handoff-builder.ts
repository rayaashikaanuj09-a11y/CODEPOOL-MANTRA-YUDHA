import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Policy } from "@/types/policy";
import { HumanHandoffPack } from "@/types/agent";

export interface HandoffInput {
  customer: Customer;
  order: Order | null;
  policy: Policy;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  customerClaims: string[];
  verifiedFacts: string[];
  contradictions: string[];
  blockedActions: string[];
  recommendedAction: string;
  ticketId?: string;
}

export class HandoffBuilder {
  public static build(input: HandoffInput): HumanHandoffPack {
    const {
      customer,
      order,
      policy,
      category,
      severity,
      customerClaims,
      verifiedFacts,
      contradictions,
      blockedActions,
      recommendedAction,
      ticketId
    } = input;

    const timestamp = Date.now().toString();
    const escalationId = `ESC-${timestamp.slice(-5)}`;
    const internalTicketId = ticketId || `TCK-ESC-${timestamp.slice(-4)}`;

    // Generate deterministic audit hash
    const rawString = `${escalationId}:${customer.id}:${order?.id || "NO_ORDER"}:${severity}:${contradictions.join(",")}`;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const auditHash = `0x${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`;

    return {
      escalationId,
      customerId: customer.id,
      customerName: customer.name,
      customerTier: customer.loyaltyTier,
      orderId: order?.id,
      caseCategory: category,
      severity,
      customerClaims,
      verifiedFacts,
      detectedContradictions: contradictions,
      blockedActions,
      governingPolicy: `${policy.category} Policy v${policy.version} (${policy.id})`,
      recommendedAgentAction: recommendedAction,
      internalTicketId,
      auditHash,
      createdAt: new Date().toISOString()
    };
  }
}
