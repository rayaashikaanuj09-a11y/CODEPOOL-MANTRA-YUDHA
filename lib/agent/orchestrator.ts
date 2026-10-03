import { repository } from "@/lib/data/repository";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Product } from "@/types/product";
import { Policy, PolicyCategory } from "@/types/policy";
import {
  AgentDecisionResponse,
  DecisionReceipt,
  DecisionTimelineEvent,
  EvidenceItem,
  ProposedAction,
  TerminalAction,
  WhyNotExplanation
} from "@/types/agent";
import { IntentParser } from "./intent-parser";
import { PolicyEngine } from "@/lib/policy/policy-engine";
import { ActionFirewall } from "@/lib/firewall/action-firewall";
import { ToolExecutionEngine } from "@/lib/tools/tool-engine";
import { HandoffBuilder } from "./handoff-builder";
import { ActionRecord } from "@/types/action";

export interface OrchestrationRequest {
  customerId: string;
  message: string;
  selectedOrderId?: string;
  asOfDateIso?: string;
}

export class AgentOrchestrator {
  public static process(request: OrchestrationRequest): AgentDecisionResponse {
    const timeline: DecisionTimelineEvent[] = [];
    const nowTime = new Date().toLocaleTimeString("en-GB", { hour12: false });

    // Step 1: Request Reception
    timeline.push({
      time: nowTime,
      step: "REQUEST_RECEIVED",
      description: `Inbound customer communication received (${request.message.length} chars).`,
      status: "INFO"
    });

    // Step 2: Customer Identity Verification
    const customer = repository.getCustomerById(request.customerId);
    if (!customer) {
      throw new Error(`Customer '${request.customerId}' could not be authenticated.`);
    }

    timeline.push({
      time: nowTime,
      step: "CUSTOMER_VERIFIED",
      description: `Authenticated: ${customer.name} (ID: ${customer.id}, Tier: ${customer.loyaltyTier}).`,
      status: "SUCCESS"
    });

    // Step 3: Intent Parsing & Injection Scan
    const parsed = IntentParser.parse(request.message);
    const intentLabels = parsed.intents.map((i) => i.intent).join(", ");
    timeline.push({
      time: nowTime,
      step: "INTENT_DECOMPOSED",
      description: `Multi-intent analysis identified: [${intentLabels}]. Injection flag: ${parsed.hasPromptInjection ? "POSITIVE" : "NEGATIVE"}.`,
      status: parsed.hasPromptInjection ? "WARNING" : "SUCCESS"
    });

    // Step 4: Context & Entity Resolution
    // Resolve order by explicit mention, explicit user selection, or customer's most recent order
    let order: Order | null = null;
    let crossCustomerViolation = false;

    if (parsed.extractedOrderId) {
      const candidate = repository.getOrderById(parsed.extractedOrderId);
      if (candidate && candidate.customerId !== customer.id) {
        crossCustomerViolation = true;
        timeline.push({
          time: nowTime,
          step: "OWNERSHIP_VIOLATION",
          description: `Order ${parsed.extractedOrderId} belongs to another customer account. Cross-tenant leakage blocked.`,
          status: "BLOCKED"
        });
      } else {
        order = candidate && candidate.customerId === customer.id ? candidate : null;
      }
    }

    if (!order && request.selectedOrderId) {
      order = repository.getOrderById(request.selectedOrderId, customer.id);
    }

    if (!order) {
      const customerOrders = repository.getOrdersByCustomerId(customer.id);
      order = customerOrders.length > 0 ? customerOrders[0] : null;
    }

    if (order) {
      timeline.push({
        time: nowTime,
        step: "ORDER_RESOLVED",
        description: `Verified order ${order.id} (Status: ${order.status}, Total: ₹${order.totalAmount.toLocaleString("en-IN")}).`,
        status: "SUCCESS"
      });
    }

    // Resolve primary product if order is found
    const primaryItem = order?.items && order.items.length > 0 ? order.items[0] : null;
    const product = primaryItem ? repository.getProductById(primaryItem.productId) : null;

    // Step 5: Prior Context Retrieval
    const priorTickets = repository.getOpenTicketsByCustomer(customer.id);
    const priorConversations = repository.getConversationsByCustomer(customer.id);

    timeline.push({
      time: nowTime,
      step: "CONTEXT_RETRIEVED",
      description: `Loaded ${priorConversations.length} previous messages and ${priorTickets.length} open tickets.`,
      status: "INFO"
    });

    // Step 6: Category Determination & Policy Time Machine
    let category: PolicyCategory = "RETURNS";
    const hasDeliveryDispute = parsed.intents.some((i) => i.intent === "DELIVERY_DISPUTE");
    const hasRefund = parsed.intents.some((i) => i.intent === "REFUND");
    const hasWarranty = parsed.intents.some((i) => i.intent === "WARRANTY");
    const hasAddressChange = parsed.intents.some((i) => i.intent === "ADDRESS_CHANGE");

    if (hasDeliveryDispute) category = "DELIVERY";
    else if (hasWarranty) category = "WARRANTY";
    else if (hasRefund) category = "REFUNDS";
    else category = "RETURNS";

    const orderDateToUse = order?.placedAt || new Date().toISOString();
    const timeMachine = PolicyEngine.resolvePolicyTimeMachine(category, orderDateToUse, request.asOfDateIso);
    const activePolicy = timeMachine.applicablePolicy;

    timeline.push({
      time: nowTime,
      step: "POLICY_RESOLVED",
      description: `Governing policy: ${activePolicy.category} v${activePolicy.version} (Effective: ${new Date(activePolicy.effectiveFrom).getFullYear()}). ${timeMachine.versionMismatch ? "Policy Time Machine adjusted for order creation date." : ""}`,
      status: "SUCCESS"
    });

    // Step 7: Check OTP Delivery Contradiction
    const claimsNonDeliveryWithOtpProof =
      hasDeliveryDispute &&
      order !== null &&
      order.status === "DELIVERED" &&
      order.deliveryProof?.otpVerified === true;

    if (claimsNonDeliveryWithOtpProof) {
      timeline.push({
        time: nowTime,
        step: "CONTRADICTION_DETECTED",
        description: `CRITICAL CONTRADICTION: Customer claims non-delivery, but carrier logs prove OTP verification at delivery address.`,
        status: "WARNING"
      });
    }

    // Step 8: Build Evidence / Trust Layer
    const evidenceList: EvidenceItem[] = [];

    // Customer Claims
    parsed.intents.forEach((intent, idx) => {
      evidenceList.push({
        id: `EV-CLM-${idx + 1}`,
        category: "CUSTOMER_CLAIM",
        label: `Customer Statement (${intent.intent})`,
        value: intent.rawTextSegment,
        source: "Inbound message",
        status: parsed.hasPromptInjection && intent.intent === "PROMPT_INJECTION" ? "BLOCKED" : "UNVERIFIED",
        timestamp: nowTime
      });
    });

    if (parsed.extractedAmount) {
      evidenceList.push({
        id: `EV-CLM-AMT`,
        category: "CUSTOMER_CLAIM",
        label: "Requested Refund Amount",
        value: `₹${parsed.extractedAmount.toLocaleString("en-IN")}`,
        source: "Inbound message text",
        status: "UNVERIFIED",
        timestamp: nowTime
      });
    }

    if (parsed.extractedAddress) {
      evidenceList.push({
        id: `EV-CLM-ADDR`,
        category: "CUSTOMER_CLAIM",
        label: "Requested Destination Address",
        value: parsed.extractedAddress,
        source: "Inbound message text",
        status: "UNVERIFIED",
        timestamp: nowTime
      });
    }

    // Verified Database Facts
    evidenceList.push({
      id: "EV-DB-CUST",
      category: "VERIFIED_DB_FACT",
      label: "Customer Account",
      value: `${customer.name} (Tier: ${customer.loyaltyTier}, Flags: ${customer.refundRiskFlags.length ? customer.refundRiskFlags.join(", ") : "None"})`,
      source: "Postgres Customer Ledger",
      status: "VERIFIED",
      timestamp: nowTime
    });

    if (order) {
      evidenceList.push({
        id: "EV-DB-ORD",
        category: "VERIFIED_DB_FACT",
        label: "Order State",
        value: `Order #${order.id} | Status: ${order.status} | Value: ₹${order.totalAmount.toLocaleString("en-IN")}`,
        source: "Order Fulfillment DB",
        status: "VERIFIED",
        timestamp: nowTime
      });

      if (order.deliveryProof) {
        evidenceList.push({
          id: "EV-DB-DEL",
          category: "VERIFIED_DB_FACT",
          label: "Delivery Proof (Carrier)",
          value: `Delivered by ${order.deliveryProof.carrier} | OTP Verified: ${order.deliveryProof.otpVerified ? "YES" : "NO"} | Tracking: ${order.deliveryProof.trackingNumber || "N/A"}`,
          source: "Logistics Carrier API (EDI-214)",
          status: claimsNonDeliveryWithOtpProof ? "CONFLICT" : "VERIFIED",
          timestamp: nowTime
        });
      }
    }

    if (product) {
      evidenceList.push({
        id: "EV-DB-PRD",
        category: "VERIFIED_DB_FACT",
        label: "Product Specs & Returnability",
        value: `${product.name} | Returnable: ${product.returnable ? "YES" : "NO"} | Warranty: ${product.warrantyMonths} Months`,
        source: "Product Catalog",
        status: "VERIFIED",
        timestamp: nowTime
      });
    }

    // Policy Rule Evidence
    evidenceList.push({
      id: "EV-POL-RULE",
      category: "POLICY_RULE",
      label: `Governing Rule: ${activePolicy.category} v${activePolicy.version}`,
      value: activePolicy.humanReadableSummary,
      source: `Policy Registry (${activePolicy.id})`,
      status: "VERIFIED",
      timestamp: nowTime
    });

    // Step 9: LLM Layer (Action Proposer)
    // The LLM understands customer text and proposes candidate actions
    const proposedActions: ProposedAction[] = [];

    if (hasRefund) {
      proposedActions.push({
        actionType: "ISSUE_REFUND",
        targetId: order?.id,
        requestedAmount: parsed.extractedAmount,
        origin: "LLM_PROPOSAL"
      });
    }

    if (parsed.intents.some((i) => i.intent === "RETURN")) {
      proposedActions.push({
        actionType: "CREATE_RETURN",
        targetId: order?.id,
        origin: "LLM_PROPOSAL"
      });
    }

    if (hasAddressChange) {
      proposedActions.push({
        actionType: "CHANGE_DELIVERY_ADDRESS",
        targetId: order?.id,
        requestedChanges: { newAddress: parsed.extractedAddress },
        origin: "LLM_PROPOSAL"
      });
    }

    if (hasDeliveryDispute || claimsNonDeliveryWithOtpProof || parsed.hasPromptInjection || hasWarranty) {
      proposedActions.push({
        actionType: "CREATE_TICKET",
        targetId: order?.id,
        origin: "LLM_PROPOSAL"
      });
    }

    timeline.push({
      time: nowTime,
      step: "LLM_PROPOSED_ACTIONS",
      description: `LLM decomposed request and proposed ${proposedActions.length} candidate operations: [${proposedActions.map((a) => a.actionType).join(", ")}].`,
      status: "INFO"
    });

    // Step 10: ACTION FIREWALL EVALUATION (Primary Differentiator)
    const firewallResult = ActionFirewall.evaluate({
      customer,
      order,
      product,
      proposedActions,
      hasPromptInjection: parsed.hasPromptInjection,
      claimsNonDeliveryWithOtpProof,
      isWarrantyRequest: hasWarranty,
      policy: activePolicy
    });

    timeline.push({
      time: nowTime,
      step: "ACTION_FIREWALL_EVALUATION",
      description: `Action Firewall Gate evaluated: Status = ${firewallResult.firewallStatus}. ${firewallResult.checks.filter((c) => c.status === "BLOCKED").length} blocks enforced.`,
      status: firewallResult.firewallStatus === "ALLOWED" ? "SUCCESS" : "WARNING"
    });

    // Step 11: Determine Terminal Action
    let terminalAction: TerminalAction = "ANSWER";
    let actionReason = "";
    let customerMessage = "";
    let whyNot: WhyNotExplanation | undefined = undefined;
    let handoffPack: any = undefined;
    const executedActions: ActionRecord[] = [];
    let calculationTrace: any = undefined;

    // Refund calculation trace if applicable
    if (order && (hasRefund || parsed.intents.some((i) => i.intent === "RETURN"))) {
      const calc = PolicyEngine.calculateRefund(order, parsed.extractedAmount);
      calculationTrace = {
        orderTotal: calc.orderTotal,
        existingRefunds: calc.existingRefunds,
        restockingFeePercent: calc.restockingFeePercent,
        restockingFeeAmount: calc.restockingFeeAmount,
        maxCalculatedRefund: calc.maxPermittedRefund,
        approvedRefund: firewallResult.authorizedActions.find((a) => a.actionType === "ISSUE_REFUND" && a.status === "ALLOWED")?.authorizedAmount || 0,
        autoApprovalLimit: calc.autoApprovalLimit,
        approvalThresholdExceeded: calc.exceedsApprovalThreshold
      };
    }

    // --- Scenario A: Contradiction / Injection / High Risk Escalation ---
    if (claimsNonDeliveryWithOtpProof || parsed.hasPromptInjection || crossCustomerViolation || firewallResult.firewallStatus === "ESCALATED") {
      terminalAction = "ESCALATE";

      const blockedList: string[] = [];
      firewallResult.authorizedActions
        .filter((a) => a.status === "BLOCKED")
        .forEach((a) => blockedList.push(a.actionType));

      if (claimsNonDeliveryWithOtpProof) {
        actionReason = "Non-delivery claim directly contradicts carrier OTP delivery confirmation. Autonomous actions blocked; escalated to Human Logistics Team.";
        blockedList.push("AUTOMATIC_REFUND", "ADDRESS_REROUTE");

        whyNot = {
          headline: "Why wasn't the refund or address change processed?",
          blockedAction: "Automatic Refund & In-Transit Address Reroute",
          customerClaim: parsed.intents.find((i) => i.intent === "DELIVERY_DISPUTE")?.rawTextSegment || "Order never arrived.",
          verifiedFacts: [
            `Order #${order?.id} status is DELIVERED.`,
            `Carrier ${order?.deliveryProof?.carrier} confirmed delivery with verified OTP on ${order?.deliveryProof?.deliveredAt ? new Date(order.deliveryProof.deliveredAt).toLocaleString("en-IN") : "Sept 28"}.`,
            `In-transit destination address rewriting is prohibited for already delivered shipments.`
          ],
          conflictReason: "Carrier delivery record contradicts customer non-delivery statement. System cannot issue unverified financial concessions.",
          governingPolicy: `${activePolicy.category} Policy v${activePolicy.version} (DEL-1.0)`,
          recommendedNextStep: "Human logistics specialist will contact delivery driver and inspect GPS coordinates of delivery scan."
        };

        handoffPack = HandoffBuilder.build({
          customer,
          order,
          policy: activePolicy,
          category: "DELIVERY_CONTRADICTION",
          severity: "HIGH",
          customerClaims: [
            "Customer claims package was never received.",
            parsed.extractedAmount ? `Demanded refund of ₹${parsed.extractedAmount.toLocaleString("en-IN")}` : "Requested financial restitution",
            parsed.extractedAddress ? `Requested address change to ${parsed.extractedAddress}` : "Requested delivery reroute"
          ],
          verifiedFacts: [
            `Customer ID: ${customer.id} (${customer.name}, Tier: ${customer.loyaltyTier})`,
            `Order ID: ${order?.id} (Total: ₹${order?.totalAmount.toLocaleString("en-IN")})`,
            `Carrier: ${order?.deliveryProof?.carrier} | Tracking: ${order?.deliveryProof?.trackingNumber}`,
            `Delivery Proof: OTP verified at recipient premises`
          ],
          contradictions: [
            "Customer non-delivery statement conflicts with OTP-verified delivery proof."
          ],
          blockedActions: ["ISSUE_REFUND", "CHANGE_DELIVERY_ADDRESS"],
          recommendedAction: "Escalate to Tier-2 Logistics Dispatch. Verify courier GPS coordinates & signature scan."
        });

        // Record escalation action
        const escAction = ToolExecutionEngine.escalateToHuman(customer.id, order?.id, handoffPack);
        executedActions.push(escAction);

        customerMessage = `Hello ${customer.name}, our carrier records indicate that Order #${order?.id} was successfully delivered on ${order?.deliveryProof?.deliveredAt ? new Date(order.deliveryProof.deliveredAt).toLocaleDateString("en-IN") : "Sept 28"} with verified OTP confirmation. Because of this delivery confirmation, automatic refunds and address modifications cannot be processed. I have opened priority investigation packet #${handoffPack.escalationId} with our Senior Logistics Team, who will coordinate with the courier and contact you directly within 24 hours.`;
      } else if (hasWarranty) {
        actionReason = "Hardware defect reported for product within manufacturer warranty period. Routed to Authorized Service Specialist.";
        const warrantyInfo = order && product ? PolicyEngine.checkWarrantyCoverage(order, product) : null;

        whyNot = {
          headline: "Why wasn't an immediate purchase refund issued?",
          blockedAction: "Standard Purchase Refund",
          customerClaim: parsed.intents.find((i) => i.intent === "WARRANTY")?.rawTextSegment || "Defect reported.",
          verifiedFacts: [
            `Order placed on ${order ? new Date(order.placedAt).toLocaleDateString("en-IN") : "N/A"} (${warrantyInfo?.monthsElapsed || 4} months ago).`,
            `Exceeds 14-day standard return window.`,
            `Covered under active ${product?.warrantyMonths || 12}-month manufacturer warranty.`
          ],
          conflictReason: "Electronic defects past return window must be inspected and serviced under OEM Warranty terms, rather than refunded as buyer remorse.",
          governingPolicy: `Warranty Policy v${activePolicy.version} (WAR-1.0)`,
          recommendedNextStep: "Schedule authorized service center technician appointment or generate warranty RMA pickup."
        };

        handoffPack = HandoffBuilder.build({
          customer,
          order,
          policy: activePolicy,
          category: "WARRANTY_ASSESSMENT",
          severity: "MEDIUM",
          customerClaims: ["Hardware screen flickering / functional defect reported"],
          verifiedFacts: [
            `Product: ${product?.name}`,
            `Warranty Active: ${product?.warrantyMonths} Months (${warrantyInfo?.monthsElapsed || 4} months elapsed)`,
            `Purchase Date: ${order?.placedAt}`
          ],
          contradictions: ["Return window closed; eligible for manufacturer warranty service."],
          blockedActions: ["PURCHASE_REFUND"],
          recommendedAction: "Dispatch OEM certified technician for hardware diagnostic inspection."
        });

        const ticketAction = ToolExecutionEngine.createSupportTicket(
          customer.id,
          order?.id,
          "WARRANTY",
          `Warranty evaluation requested for ${product?.name}. Screen flickering defect.`,
          ["WARRANTY_RMA_PENDING"]
        );
        executedActions.push(ticketAction);

        customerMessage = `Hello ${customer.name}, your ${product?.name} is covered under our 12-month NovaCare Manufacturer Warranty (valid until ${warrantyInfo?.warrantyExpiresAt || "May 2027"}). Under Warranty Policy v1.0, hardware issues are serviced through certified repair or replacement. I have opened warranty ticket #${ticketAction.payload.ticketId} and assigned our Technical Specialist team to arrange a diagnostics intake.`;
      } else {
        // General or injection escalation
        actionReason = "Security filter or policy rule triggered escalation.";
        handoffPack = HandoffBuilder.build({
          customer,
          order,
          policy: activePolicy,
          category: "POLICY_REVIEW",
          severity: "HIGH",
          customerClaims: [request.message],
          verifiedFacts: [`Customer ID: ${customer.id}`],
          contradictions: parsed.hasPromptInjection ? ["System prompt override detected."] : ["Complex request requires human discretion."],
          blockedActions: ["UNVERIFIED_ACTION"],
          recommendedAction: "Review message context and resolve customer query manually."
        });

        customerMessage = `Hello ${customer.name}, your request has been safely flagged for review by our Customer Trust & Safety desk under Reference #${handoffPack.escalationId}. A representative will review your request shortly.`;
      }

      timeline.push({
        time: nowTime,
        step: "ESCALATION_DISPATCHED",
        description: `Terminal outcome ESCALATE executed. Human Handoff Pack #${handoffPack.escalationId} compiled with audit hash ${handoffPack.auditHash}.`,
        status: "SUCCESS"
      });
    }
    // --- Scenario B: Valid Return / Refund Execution (ACT) ---
    else if (
      firewallResult.firewallStatus === "ALLOWED" &&
      firewallResult.authorizedActions.some((a) => a.status === "ALLOWED")
    ) {
      terminalAction = "ACT";
      actionReason = "Request satisfied all return eligibility criteria and Action Firewall checks. Execution authorized.";

      let returnAction: ActionRecord | null = null;
      let refundAction: ActionRecord | null = null;

      if (order && product) {
        // Execute Return Creation
        returnAction = ToolExecutionEngine.createReturn(
          customer.id,
          order.id,
          activePolicy.version,
          "Customer requested return within valid policy window"
        );
        executedActions.push(returnAction);

        // Verify action in ledger
        const returnVerification = ToolExecutionEngine.verifyActionResult(returnAction.id);
        timeline.push({
          time: nowTime,
          step: "RETURN_EXECUTED_AND_VERIFIED",
          description: `Return ${returnAction.payload.returnReference} registered. Ledger verification: ${returnVerification.verified ? "CONFIRMED" : "FAILED"}.`,
          status: "SUCCESS"
        });

        // If refund authorized
        const refundAuth = firewallResult.authorizedActions.find((a) => a.actionType === "ISSUE_REFUND" && a.status === "ALLOWED");
        if (refundAuth && refundAuth.authorizedAmount) {
          const restockingFee = calculationTrace?.restockingFeeAmount || 0;
          refundAction = ToolExecutionEngine.createRefund(
            customer.id,
            order.id,
            refundAuth.authorizedAmount,
            activePolicy.version,
            restockingFee
          );
          executedActions.push(refundAction);

          const refundVerification = ToolExecutionEngine.verifyActionResult(refundAction.id);
          timeline.push({
            time: nowTime,
            step: "REFUND_EXECUTED_AND_VERIFIED",
            description: `Refund ₹${refundAuth.authorizedAmount.toLocaleString("en-IN")} credited. Ledger verification: ${refundVerification.verified ? "CONFIRMED" : "FAILED"}.`,
            status: "SUCCESS"
          });
        }
      }

      const returnRef = returnAction?.payload?.returnReference || "RET-CONFIRMED";
      const refundAmt = calculationTrace?.approvedRefund || calculationTrace?.maxCalculatedRefund || 0;

      customerMessage = `Hello ${customer.name}, good news! Your return for Order #${order?.id} (${product?.name}) has been approved under Returns Policy v${activePolicy.version}. As a valued ${customer.loyaltyTier} member, your return authorization #${returnRef} has been scheduled for complimentary pickup via BlueDart Reverse Logistics at ${order?.deliveryAddress}. Upon warehouse scan, ₹${refundAmt.toLocaleString("en-IN")} (after ${activePolicy.rules.restockingFeePercent || 5}% standard restocking fee of ₹${calculationTrace?.restockingFeeAmount || 0}) will be credited to your original payment method.`;
    }
    // --- Scenario C: Clarification / Question (ASK) ---
    else if (!order) {
      terminalAction = "ASK";
      actionReason = "Unable to determine target order for requested operation. Clarification required.";
      customerMessage = `Hello ${customer.name}, I would be glad to help you with that. Could you please specify which order you are referring to? You currently have ${repository.getOrdersByCustomerId(customer.id).length} order(s) on your account.`;
      timeline.push({
        time: nowTime,
        step: "CLARIFICATION_REQUESTED",
        description: "Terminal outcome ASK: Prompted customer for order identifier.",
        status: "INFO"
      });
    }
    // --- Scenario D: Informational Answer (ANSWER) ---
    else {
      terminalAction = "ANSWER";
      actionReason = "Provided verified policy information.";
      customerMessage = `Hello ${customer.name}, thank you for contacting NovaMart TrustDesk. Regarding your inquiry, Order #${order.id} is governed by ${activePolicy.category} Policy v${activePolicy.version}. If you require an exchange, return, or technical support, please let me know and I will assist you.`;
      timeline.push({
        time: nowTime,
        step: "ANSWER_GENERATED",
        description: "Terminal outcome ANSWER: Delivered verified policy guidance.",
        status: "SUCCESS"
      });
    }

    // Step 12: Assemble Decision Receipt
    const receipt: DecisionReceipt = {
      receiptId: `RCP-${Date.now().toString().slice(-7)}`,
      timestamp: new Date().toISOString(),
      terminalAction,
      actionReason,
      intents: parsed.intents,
      evidenceList,
      policyApplied: activePolicy,
      policyTimeMachine: timeMachine,
      actionFirewall: firewallResult,
      timeline,
      whyNot,
      humanHandoffPack: handoffPack,
      executedActions,
      calculationTrace
    };

    // Record interaction in conversation memory
    repository.addConversationMessage({
      id: `MSG-${Date.now().toString().slice(-6)}`,
      customerId: customer.id,
      orderId: order?.id,
      role: "CUSTOMER",
      message: request.message,
      createdAt: new Date().toISOString()
    });

    repository.addConversationMessage({
      id: `MSG-${Date.now().toString().slice(-6)}-RES`,
      customerId: customer.id,
      orderId: order?.id,
      role: "AGENT",
      message: customerMessage,
      createdAt: new Date().toISOString()
    });

    return {
      terminalAction,
      customerMessage,
      receipt
    };
  }
}
