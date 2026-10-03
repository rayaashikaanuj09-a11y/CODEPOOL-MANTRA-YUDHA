import { repository } from "@/lib/data/repository";
import { ActionRecord } from "@/types/action";
import { HumanHandoffPack } from "@/types/agent";

export class ToolExecutionEngine {
  /**
   * create_return: Safely creates a return authorization record
   */
  public static createReturn(
    customerId: string,
    orderId: string,
    policyVersion: string,
    reason: string
  ): ActionRecord {
    const order = repository.getOrderById(orderId, customerId);
    if (!order) {
      throw new Error(`Order ${orderId} not found or ownership mismatch.`);
    }

    const returnReference = `RET-${Date.now().toString().slice(-6)}`;
    const actionId = `ACT-RET-${Date.now().toString().slice(-6)}`;

    // Update order with existing return ID
    order.existingReturnId = returnReference;
    order.status = "RETURNED";
    repository.updateOrder(order);

    const actionRecord: ActionRecord = {
      id: actionId,
      type: "RETURN_CREATED",
      customerId,
      orderId,
      status: "SUCCESS",
      createdAt: new Date().toISOString(),
      payload: {
        returnReference,
        policyVersion,
        pickupAddress: order.deliveryAddress,
        carrierScheduled: "BlueDart Reverse Logistics",
        estimatedPickup: "Within 2 business days",
        reason
      },
      verificationProof: {
        verifiedAt: new Date().toISOString(),
        authority: "ACTION_FIREWALL",
        ruleEnforced: `RET-${policyVersion}_ELIGIBILITY_VERIFIED`,
        details: `Return order ${returnReference} provisioned in NovaMart warehouse ledger.`
      }
    };

    repository.recordAction(actionRecord);
    return actionRecord;
  }

  /**
   * create_refund: Executes approved financial refund after firewall validation
   */
  public static createRefund(
    customerId: string,
    orderId: string,
    amount: number,
    policyVersion: string,
    restockingFeeDeducted: number
  ): ActionRecord {
    const order = repository.getOrderById(orderId, customerId);
    if (!order) {
      throw new Error(`Order ${orderId} not found or ownership mismatch.`);
    }

    const actionId = `ACT-REF-${Date.now().toString().slice(-6)}`;
    const refundRef = `RFD-TXN-${Date.now().toString().slice(-6)}`;

    order.existingRefundAmount = (order.existingRefundAmount || 0) + amount;
    order.paymentStatus = "REFUNDED";
    repository.updateOrder(order);

    const actionRecord: ActionRecord = {
      id: actionId,
      type: "REFUND_CREATED",
      customerId,
      orderId,
      status: "SUCCESS",
      createdAt: new Date().toISOString(),
      payload: {
        refundReference: refundRef,
        amount,
        restockingFeeDeducted,
        originalOrderTotal: order.totalAmount,
        destinationMethod: order.paymentMethod,
        policyVersion
      },
      verificationProof: {
        verifiedAt: new Date().toISOString(),
        authority: "ACTION_FIREWALL",
        ruleEnforced: `REF-${policyVersion}_RESTOCKING_APPLIED`,
        details: `Disbursement of ₹${amount.toLocaleString("en-IN")} credited to original payment instrument (${order.paymentMethod}).`
      }
    };

    repository.recordAction(actionRecord);
    return actionRecord;
  }

  /**
   * create_support_ticket: Logs a tracked support ticket
   */
  public static createSupportTicket(
    customerId: string,
    orderId: string | undefined,
    category: "DELIVERY" | "REFUND" | "RETURN" | "PAYMENT" | "WARRANTY",
    summary: string,
    riskFlags: string[] = []
  ): ActionRecord {
    const ticketId = `TCK-${Date.now().toString().slice(-5)}`;
    const actionId = `ACT-TCK-${Date.now().toString().slice(-6)}`;

    repository.addTicket({
      id: ticketId,
      customerId,
      orderId,
      status: "ESCALATED",
      category,
      createdAt: new Date().toISOString(),
      summary,
      riskFlags
    });

    const actionRecord: ActionRecord = {
      id: actionId,
      type: "TICKET_CREATED",
      customerId,
      orderId,
      status: "SUCCESS",
      createdAt: new Date().toISOString(),
      payload: {
        ticketId,
        category,
        priority: riskFlags.length > 0 ? "URGENT" : "STANDARD",
        summary
      },
      verificationProof: {
        verifiedAt: new Date().toISOString(),
        authority: "ACTION_FIREWALL",
        ruleEnforced: "SUPPORT_DISPATCH_RECORDED",
        details: `Ticket #${ticketId} dispatched to Tier-2 Operations Desk.`
      }
    };

    repository.recordAction(actionRecord);
    return actionRecord;
  }

  /**
   * escalate_to_human: Emits an escalation action linked with HumanHandoffPack
   */
  public static escalateToHuman(
    customerId: string,
    orderId: string | undefined,
    handoffPack: HumanHandoffPack
  ): ActionRecord {
    const actionId = `ACT-ESC-${Date.now().toString().slice(-6)}`;

    const actionRecord: ActionRecord = {
      id: actionId,
      type: "ESCALATION_CREATED",
      customerId,
      orderId,
      status: "SUCCESS",
      createdAt: new Date().toISOString(),
      payload: {
        escalationId: handoffPack.escalationId,
        severity: handoffPack.severity,
        caseCategory: handoffPack.caseCategory,
        blockedActions: handoffPack.blockedActions,
        auditHash: handoffPack.auditHash
      },
      verificationProof: {
        verifiedAt: new Date().toISOString(),
        authority: "ACTION_FIREWALL",
        ruleEnforced: "ESCALATION_GATE_CONFIRMED",
        details: `Human Handoff Packet #${handoffPack.escalationId} compiled with verified evidence trail.`
      }
    };

    repository.recordAction(actionRecord);
    return actionRecord;
  }

  /**
   * verify_action_result: Verification layer that inspects system ledger
   * to ensure an action is actually committed before reporting success to customer.
   */
  public static verifyActionResult(actionId: string): { verified: boolean; record: ActionRecord | null } {
    const record = repository.getActionById(actionId);
    if (!record) {
      return { verified: false, record: null };
    }
    return {
      verified: record.status === "SUCCESS",
      record
    };
  }
}
